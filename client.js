document.addEventListener('DOMContentLoaded', function() {
    // get DOM elements
    var dataChannelLog = document.getElementById('data-channel'),
        iceConnectionLog = document.getElementById('ice-connection-state'),
        iceGatheringLog = document.getElementById('ice-gathering-state'),
        signalingLog = document.getElementById('signaling-state'),
        startButton = document.getElementById('start'),
        stopButton = document.getElementById('stop'),
        mediaContainer = document.getElementById('media');

    // peer connection
    var pc = null;

    // data channel
    var dc = null, dcInterval = null;

    function createPeerConnection() {
        var config = {
            sdpSemantics: 'unified-plan'
        };

        if (document.getElementById('use-stun').checked) {
            config.iceServers = [{urls: ['stun:stun.l.google.com:19302']}];
        }

        pc = new RTCPeerConnection(config);

        // register listeners for ICE gathering, ICE connection, and signaling state changes
        pc.addEventListener('icegatheringstatechange', function() {
            iceGatheringLog.textContent += ' -> ' + pc.iceGatheringState;
            console.log('ICE Gathering State:', pc.iceGatheringState);
        });
        iceGatheringLog.textContent = pc.iceGatheringState;

        pc.addEventListener('iceconnectionstatechange', function() {
            iceConnectionLog.textContent += ' -> ' + pc.iceConnectionState;
            console.log('ICE Connection State:', pc.iceConnectionState);
        });
        iceConnectionLog.textContent = pc.iceConnectionState;

        pc.addEventListener('signalingstatechange', function() {
            signalingLog.textContent += ' -> ' + pc.signalingState;
            console.log('Signaling State:', pc.signalingState);
        });
        signalingLog.textContent = pc.signalingState;

        // connect audio / video
        pc.addEventListener('track', function(evt) {
            if (evt.track.kind === 'video') {
                document.getElementById('video').srcObject = evt.streams[0];
                console.log('Video track added');
            } else {
                document.getElementById('audio').srcObject = evt.streams[0];
                console.log('Audio track added');
            }
        });

        return pc;
    }

    function negotiate() {
        return pc.createOffer().then(function(offer) {
            console.log('Offer created:', offer);
            return pc.setLocalDescription(offer);
        }).then(function() {
            console.log('Local description set');
            // wait for ICE gathering to complete
            return new Promise(function(resolve) {
                if (pc.iceGatheringState === 'complete') {
                    resolve();
                } else {
                    function checkState() {
                        if (pc.iceGatheringState === 'complete') {
                            pc.removeEventListener('icegatheringstatechange', checkState);
                            resolve();
                        }
                    }
                    pc.addEventListener('icegatheringstatechange', checkState);
                }
            });
        }).then(function() {
            var offer = pc.localDescription;
            var codec;

            codec = document.getElementById('audio-codec').value;
            if (codec !== 'default') {
                offer.sdp = sdpFilterCodec('audio', codec, offer.sdp);
            }

            codec = document.getElementById('video-codec').value;
            if (codec !== 'default') {
                offer.sdp = sdpFilterCodec('video', codec, offer.sdp);
            }

            document.getElementById('offer-sdp').textContent = offer.sdp;
            console.log('Sending offer:', offer);
            return fetch('/offer', {
                body: JSON.stringify({
                    sdp: offer.sdp,
                    type: offer.type,
                    video_transform: document.getElementById('video-transform').value
                }),
                mode: "cors",
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            });
        }).then(function(response) {
            console.log('Offer sent, response received:', response);
            return response.json();
        }).then(function(answer) {
            document.getElementById('answer-sdp').textContent = answer.sdp;
            
            // Display the pc_id in console and DOM
            console.log("PC ID:", answer.pc_id);
            document.getElementById('pc-id').textContent = "PC ID: " + answer.pc_id;

            console.log('Setting remote description:', answer);
            return pc.setRemoteDescription(answer);
        }).catch(function(e) {
            console.error('Error during negotiation:', e);
            alert(e);
        });
    }

    // Event listener for the Start button
    startButton.addEventListener('click', function() {
        console.log('Start button clicked');
        // Hide Start button, show Stop button
        startButton.style.display = 'none';
        stopButton.style.display = 'inline-block';

        // Call the start function to initialize the WebRTC connection and media
        start();
    });

    // Event listener for the Stop button
    stopButton.addEventListener('click', function() {
        console.log('Stop button clicked');
        // Hide Stop button, show Start button
        stopButton.style.display = 'none';
        startButton.style.display = 'inline-block';

        // Call the stop function to end the WebRTC connection and media
        stop();
    });

    function start() {
        console.log('Starting WebRTC connection');
        pc = createPeerConnection(); // Establish peer connection

        var constraints = {
            audio: document.getElementById('use-audio').checked,
            video: false
        };

        // Check for video
        if (document.getElementById('use-video').checked) {
            var resolution = document.getElementById('video-resolution').value;
            if (resolution) {
                resolution = resolution.split('x');
                constraints.video = {
                    width: parseInt(resolution[0], 10),
                    height: parseInt(resolution[1], 10)
                };
            } else {
                constraints.video = true; // Use default video settings
            }
        }

        // If either audio or video is enabled, start media stream
        if (constraints.audio || constraints.video) {
            mediaContainer.style.display = 'block';  // Show the media section
            console.log('Requesting media stream with constraints:', constraints);
            navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
                console.log('Media stream acquired:', stream);
                stream.getTracks().forEach(function(track) {
                    pc.addTrack(track, stream);  // Add media tracks to the peer connection
                });

                // Assign local video stream to the video element
                document.getElementById('video').srcObject = stream;

                return negotiate();  // Begin negotiation for WebRTC
            }).catch(function(err) {
                console.error('Error acquiring media:', err);
                alert('Error acquiring media: ' + err);  // Handle error
            });
        } else {
            console.log('No media selected, continuing with negotiation');
            negotiate();  // If no media selected, continue with negotiation
        }
    }

    function stop() {
        console.log('Stopping WebRTC connection');
        // Close the peer connection
        if (dc) {
            dc.close();  // Close data channel
            console.log('Data channel closed');
        }

        // Stop the transceivers if available
        if (pc.getTransceivers) {
            pc.getTransceivers().forEach(function(transceiver) {
                if (transceiver.stop) {
                    transceiver.stop();  // Stop each transceiver
                    console.log('Transceiver stopped:', transceiver);
                }
            });
        }

        // Stop the local audio and video tracks
        pc.getSenders().forEach(function(sender) {
            sender.track.stop();  // Stop each media track
            console.log('Media track stopped:', sender.track);
        });

        // Close the peer connection after a brief delay
        setTimeout(function() {
            pc.close();  // Close peer connection
            console.log('Peer connection closed');
        }, 500);

        mediaContainer.style.display = 'none';  // Hide media container when stopped
    }

    function sdpFilterCodec(kind, codec, realSdp) {
        var allowed = [];
        var rtxRegex = new RegExp('a=fmtp:(\\d+) apt=(\\d+)\r$');
        var codecRegex = new RegExp('a=rtpmap:([0-9]+) ' + escapeRegExp(codec));
        var videoRegex = new RegExp('(m=' + kind + ' .*?)( ([0-9]+))*\\s*$');
        
        var lines = realSdp.split('\n');

        var isKind = false;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('m=' + kind + ' ')) {
                isKind = true;
            } else if (lines[i].startsWith('m=')) {
                isKind = false;
            }

            if (isKind) {
                var match = lines[i].match(codecRegex);
                if (match) {
                    allowed.push(parseInt(match[1]));
                }

                match = lines[i].match(rtxRegex);
                if (match && allowed.includes(parseInt(match[2]))) {
                    allowed.push(parseInt(match[1]));
                }
            }
        }

        var skipRegex = 'a=(fmtp|rtcp-fb|rtpmap):([0-9]+)';
        var sdp = '';

        isKind = false;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('m=' + kind + ' ')) {
                isKind = true;
            } else if (lines[i].startsWith('m=')) {
                isKind = false;
            }

            if (isKind) {
                var skipMatch = lines[i].match(skipRegex);
                if (skipMatch && !allowed.includes(parseInt(skipMatch[2]))) {
                    continue;
                } else if (lines[i].match(videoRegex)) {
                    sdp += lines[i].replace(videoRegex, '$1 ' + allowed.join(' ')) + '\n';
                } else {
                    sdp += lines[i] + '\n';
                }
            } else {
                sdp += lines[i] + '\n';
            }
        }

        return sdp;
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
});