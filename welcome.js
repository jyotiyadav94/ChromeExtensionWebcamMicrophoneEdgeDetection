navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(mediaStream => {
  document.querySelector('#status').innerHTML =
    'Webcam and microphone access granted for extension, please close this tab';
  chrome.storage.local.set({
    'camAccess': true,
    'micAccess': true
  }, () => {
    // Open the popup after permission is granted
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
}).catch(err => {
  document.querySelector('#status').innerHTML =
    'Error getting webcam and microphone access for extension:' + err.toString();
  console.error(err);
});