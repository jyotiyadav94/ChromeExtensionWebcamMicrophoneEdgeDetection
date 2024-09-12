The core functionality of the code can be found here. It draws inspiration from this repository: https://github.com/aiortc/aiortc/tree/main/examples/server.

I'm working on creating a Chrome extension that replicates the behavior of the API used in the project. However, I'm encountering an error with the fetch API inside the negotiate function in JavaScript, and I’m unsure about the root cause of the issue.

# Running the Code

You can run the code either through an API or a Chrome extension. Follow the instructions below for each method.

## 1. Running the Code through API

### Prerequisites
Ensure you have python installed  on your machine.

### Steps
1. **Navigate to the project directory:**

   ```bash
   cd TypeError-Failed-To-Fetch
   ```

2. ```bash 
   python server.py
   ```

This may take a few moments the first time you run it.

Open the application in your browser once Docker Compose is ready:

```bash 
http://127.0.0.1:8080
```

Select the options:

Choose "Use video"
Set resolution to 640 x 480
Select "Features detection"
Click on the "Start" button.

<img width="1292" alt="Screenshot 2024-09-12 at 11 53 53" src="https://github.com/user-attachments/assets/21431951-ef66-4af7-b6f3-6ff5ea758739">



## 2. Running the Code through Chrome Extension

Steps
- Load the Extension into Chrome:
- Open Chrome and navigate to chrome://extensions/.
- Enable "Developer mode" by toggling the switch in the top right corner.
- Click on the "Load unpacked" button.
- Select the extension directory.



Click on the "Start" button.

<img width="1292" alt="Screenshot 2024-09-12 at 11 54 11" src="https://github.com/user-attachments/assets/bcfe7b78-efcf-4089-ab65-74fef7cdf66a">

## **Error **
TypeError: Failed to fetch

<img width="1292" alt="Screenshot 2024-09-12 at 11 54 11" src="https://github.com/user-attachments/assets/bcfe7b78-efcf-4089-ab65-74fef7cdf66a">


Error - The error is an extension that shows an error with a popup **TypeError: Failed to fetch**. While this works fine on the API but doesn't seems to be working on the extension. 

Main files for extension issues 
1. Client.js
2. popup.html
3. manifest.json
4. welcome.html
5. welcome.js
6. app.py 
