import urllib.request
import urllib.error
import json
import time

base_url = "http://localhost:8000"
test_username = f"testuser_{int(time.time())}"

def test_api():
    print("Testing Registration with invalid OTP...")
    req = urllib.request.Request(
        f"{base_url}/auth/register",
        data=json.dumps({"username": test_username, "display_name": "Test", "otp": "00000"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req)
        print("FAIL: Expected 400 for invalid OTP")
    except urllib.error.HTTPError as e:
        print("PASS:", e.code)
        
    print("Testing Registration with valid OTP...")
    req = urllib.request.Request(
        f"{base_url}/auth/register",
        data=json.dumps({"username": test_username, "display_name": "Test User", "otp": "123456"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read())
        token = data['access_token']
        print("PASS: Registered, got token:", token[:10] + "...")
    except Exception as e:
        print("FAIL:", e)
        return

    print("Testing Login with invalid credentials...")
    req = urllib.request.Request(
        f"{base_url}/auth/login",
        data=json.dumps({"username": test_username, "otp": "wrong"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req)
        print("FAIL: Expected error")
    except urllib.error.HTTPError as e:
        print("PASS:", e.code)

    print("Testing Login with valid credentials...")
    req = urllib.request.Request(
        f"{base_url}/auth/login",
        data=json.dumps({"username": test_username, "otp": "123456"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read())
        token = data['access_token']
        print("PASS: Logged in, got token")
    except Exception as e:
        print("FAIL:", e)
        return

    print("Testing /auth/me...")
    req = urllib.request.Request(
        f"{base_url}/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read())
        print("PASS: Got user profile:", data['display_name'])
    except Exception as e:
        print("FAIL:", e)

if __name__ == "__main__":
    test_api()
