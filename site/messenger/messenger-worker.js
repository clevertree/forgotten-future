importScripts('https://www.gstatic.com/firebasejs/4.1.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.1.1/firebase-messaging.js');
importScripts('https://www.gstatic.com/firebasejs/4.1.1/firebase.js');


var config = {
    apiKey: "<APIKEY>",
    authDomain: "<PROJECTID>.firebaseapp.com",
    databaseURL: "https://<DATABASE NAME>.firebaseio.com",
    projectId: "<PROJECT ID>",
    storageBucket: "<PROJECT ID>.appspot.com",
    messagingSenderId: "<SENDER ID>"
};
firebase.initializeApp(config);
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
    console.log('[messenger-worker.js] Received background messenger ', payload);
    // Customize notification here
    const notificationTitle = 'Background Message Title';
    const notificationOptions = {
        body: 'Background Message body.',
        icon: '/firebase-logo.png'
    };

    return self.registration.showNotification(notificationTitle,
        notificationOptions);
});