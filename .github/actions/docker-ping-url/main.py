import os
import requests 
import time
import sys


def ping_url(url, delay, max_trials):
    trials  = 0

    while trials < max_trials:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print(f"Website {url} is reachable.")
                return True
            else:
                print(f"Website {url} returned status {response.status_code}. Retrying in {delay} seconds...")
                time.sleep(delay)
                trials += 1
        except requests.ConnectionError:
            print(f"Website {url} is not reachable. Retrying in {delay} seconds...")
            time.sleep(delay)
            trials += 1
        except requests.exceptions.MissingSchema:
            print(f"Invalid URL: {url}. Please provide a valid URL.")
            return False  
        
    return False

def run():
    website_url = os.getenv("INPUT_URL")
    # Provide sensible defaults so the action doesn't crash when inputs are missing
    delay = int(os.getenv("INPUT_DELAY", "5"))
    max_trials = int(os.getenv("INPUT_MAX_TRIALS", "10"))

    class WebsiteUnreachableError(RuntimeError):
        pass


    website_reacheable = ping_url(website_url, delay, max_trials)

    if not website_reacheable:
        msg = f"Website {website_url} is not reachable."
        print(msg)
        # raise a specific exception so callers/tests can catch it
        raise WebsiteUnreachableError(msg)

    print(f"Website {website_url} is reachable.")

if __name__ == "__main__":
    run()