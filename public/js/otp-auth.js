firebase.initializeApp(firebaseConfig);

let otpVerified = false;
let confirmationResult;
let appVerifier;
window.onload = () => {
  // Ensure Firebase is initialized only once
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // Set up reCAPTCHA verifier
  appVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    'size': 'invisible',
    'callback': function(response) {
      console.log("reCAPTCHA solved:", response);
    }
  });

  appVerifier.render().then(function(widgetId) {
    window.recaptchaWidgetId = widgetId;
  });
};
function sendOTP() {
  const phone = document.getElementById('phone').value.trim();

  if (!phone) {
    alert("Please enter your phone number");
    return;
  }

  firebase.auth().signInWithPhoneNumber(phone, appVerifier)
    .then(result => {
      confirmationResult = result;
      alert('✅ OTP sent successfully!');
    })
    .catch(error => {
      console.error('OTP Error:', error.message);
      alert("❌ Failed to send OTP. See console for details.");
    });
}

function verifyOTP() {
  const code = document.getElementById('otp').value.trim();

  if (!code) {
    alert("Please enter the OTP");
    return;
  }

  confirmationResult.confirm(code)
    .then(result => {
      otpVerified = true;

      // Get Firebase ID token and set it in hidden field
      result.user.getIdToken().then(token => {
        document.getElementById('idToken').value = token;
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('phoneHidden').value = document.getElementById('phone').value;
        alert('✅ OTP Verified! You can now sign up.');
      });
    })
    .catch(error => {
      alert('❌ Invalid OTP. Try again.');
    });
}