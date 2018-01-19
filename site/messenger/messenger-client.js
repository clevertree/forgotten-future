"use strict";

var messenger = (function() {
    function Messenger() {
    }

    var clientToken = null;

    // Messenger.prototype.requestNotificationPermission = unavailable;
    // Messenger.prototype.getNotificationToken = unavailable;
    // Messenger.prototype.subscribe = unavailable;

    site.includeScript('https://www.gstatic.com/firebasejs/4.9.0/firebase.js', function() {

//     document.addEventListener("DOMContentLoaded", function() {

        // Push notifications

        if(firebase) {
            // Initialize Firebase
            var config = {
                apiKey: "AIzaSyCAt5-jWUZm44niJxq4c1PonrnQdJI0v-U",
                authDomain: "forgotten-future.firebaseapp.com",
                databaseURL: "https://forgotten-future.firebaseio.com",
                projectId: "forgotten-future",
                storageBucket: "",
                messagingSenderId: "249322981702"
            };
            firebase.initializeApp(config);
            navigator.serviceWorker.register('messenger/messenger-worker.js')
                .then(function(registration) {
                    messaging.useServiceWorker(registration);
                });

            var messaging = firebase.messaging();

            // Callback fired if Instance ID token is updated.
            messaging.onTokenRefresh(function () {
                messaging.getToken()
                    .then(function (refreshedToken) {
                        console.log('Token refreshed:', refreshedToken);
                        if(refreshedToken)
                            clientToken = refreshedToken;

                        sendTokenToServer(refreshedToken);
                    })
                    .catch(function (err) {
                        console.log('Unable to retrieve refreshed token ', err);
                        // showToken('Unable to retrieve refreshed token ', err);
                    });
            });

            Messenger.prototype.requestNotificationPermission = function(callback) {
                // var messaging = firebase.messaging();
                messaging.requestPermission()
                    .then(function () {
                        if(callback)
                            callback();
                        console.log('Notification permission granted.');
                        // TODO(developer): Retrieve an Instance ID token for use with FCM.
                        // ...
                    })
                    .catch(function (err) {
                        if(callback)
                            callback(err);
                        console.log('Unable to get permission to notify.', err);
                    });
            };

            Messenger.prototype.getNotificationToken = function(callback) {
                // var messaging = firebase.messaging();
                // Get Instance ID token. Initially this makes a network call, once retrieved
                // subsequent calls to getToken will return from cache.
                messaging.getToken()
                    .then(function (currentToken) {
                        if (currentToken) {
                            callback(currentToken);

                        } else {
                            callback(null, new Error('No Instance ID token available. Request permission to generate one.'));
                        }
                    })
                    .catch(function (err) {
                        callback(null, err);
                        console.log('An error occurred while retrieving token. ', err);
                    });
            };

            Messenger.prototype.subscribe = function () {
                console.log("Requesting permission for notification");
                messenger.requestNotificationPermission(function () {
                    console.log("Requesting notification token");
                    messenger.getNotificationToken(function(token, err) {
                        if(err) {
                            // console.error("Error requesting notification token: ", err);
                            clientToken = null;
                            throw err;
                        }

                        if(token) {
                            clientToken = token;
                            console.info("Notification Token: ", token);
                            sendTokenToServer(token);
                            // updateUIForPushEnabled(currentToken);

                        } else {
                            // Show permission request.
                            console.log('No Instance ID token available. Request permission to generate one.');
                            // Show permission UI.
                            // updateUIForPushPermissionRequired();
                            // setTokenSentToServer(false);
                        }
                    })
                })
            }
        }

//     });

    });

    function sendTokenToServer(token) {
        // Send Instance ID token to server.
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", "messenger/messenger.php");
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.send(JSON.stringify({
            action: 'subscribe',
            token:  token
        }));
        xmlhttp.onreadystatechange = function () {
            if(xmlhttp.readyState === XMLHttpRequest.DONE) {
                var json = JSON.parse(xmlhttp.responseText);
                if(xmlhttp.status === 200) {
                    console.log(xmlhttp.message);
                } else {
                    console.error(xmlhttp.responseText);
                }
            }
        };
    }

    function unavailable() {
        throw new Error("Unavailable");
    }
    return new Messenger;
})();
