"""
Quick test script to verify server setup
"""
import sys

def test_dependencies():
    """Test if all required packages are installed"""
    print("Testing dependencies...")
    
    try:
        import fastapi
        print("[OK] FastAPI installed")
    except ImportError:
        print("[FAIL] FastAPI NOT installed")
        return False
    
    try:
        import uvicorn
        print("[OK] Uvicorn installed")
    except ImportError:
        print("[FAIL] Uvicorn NOT installed")
        return False
    
    try:
        import websockets
        print("[OK] WebSockets installed")
    except ImportError:
        print("[FAIL] WebSockets NOT installed")
        return False
    
    return True

def test_files():
    """Test if all required files exist"""
    print("\nTesting files...")
    import os
    
    required_files = [
        'server.py',
        'index.html',
        'teamchat-plus.html',
        'js/app.js',
        'js/chatroom.js',
        'js/utils.js',
        'requirements.txt'
    ]
    
    all_exist = True
    for file in required_files:
        if os.path.exists(file):
            print(f"[OK] {file} exists")
        else:
            print(f"[FAIL] {file} NOT found")
            all_exist = False
    
    # Check uploads directory
    if os.path.exists('uploads'):
        print("[OK] uploads/ directory exists")
    else:
        print("[FAIL] uploads/ directory NOT found")
        print("  Creating uploads/ directory...")
        try:
            os.makedirs('uploads', exist_ok=True)
            print("  [OK] uploads/ directory created")
        except Exception as e:
            print(f"  [FAIL] Failed to create uploads/ directory: {e}")
            all_exist = False
    
    return all_exist

def main():
    print("=" * 60)
    print("TeamChat+ Server Test")
    print("=" * 60)
    
    deps_ok = test_dependencies()
    files_ok = test_files()
    
    print("\n" + "=" * 60)
    if deps_ok and files_ok:
        print("[SUCCESS] ALL TESTS PASSED!")
        print("\nYou can now start the server with:")
        print("  python server.py")
        print("\nThen open your browser to:")
        print("  http://localhost:8000")
    else:
        print("[ERROR] SOME TESTS FAILED")
        if not deps_ok:
            print("\nPlease install dependencies:")
            print("  pip install -r requirements.txt")
        if not files_ok:
            print("\nSome required files are missing.")
            print("Please ensure all files are in the correct location.")
    print("=" * 60)

if __name__ == "__main__":
    main()

