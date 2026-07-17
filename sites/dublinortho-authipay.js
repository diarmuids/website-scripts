// Last updated: 2026-07-17 17:45:37 +01:00

// // UPDATE FORM ATTRIBUTE FOR PLAUSIBLE TRACKING
// function updateFormAttributes() {
//   var clinicValue = $('#patientClinic').val();
//   var emailMap = {
//     'Malahide': 'malahide@dublinorthodontics.ie',
//     'Clontarf': 'clontarf@dublinorthodontics.ie',
//     'Ranelagh D6': 'northbrook@dublinorthodontics.ie',
//     'Swords': 'swords@dublinorthodontics.ie',
//     'Ratoath': 'info@ratoathorthodontics.ie'
//   };
//   $('[name="patientClinicEmail"]').val(emailMap[clinicValue] || '');
// }

// $('#patientClinic').on('change', updateFormAttributes);

// // DECIMAL PLACE THE AMOUNT
// $('#chargetotal').on('blur', function () {
//   let value = parseFloat($(this).val().trim());
//   if (!isNaN(value)) {
//     $(this).val(value.toFixed(2));
//   }
// });

// // // FUNCTION TO CALCULATE DATE-TIME
// function getFormattedTxndatetime() {
//   const now = new Date();

//   // Format as "YYYY:MM:DD-HH:MM:SS" in local time (London)
//   const pad = (n) => (n < 10 ? '0' + n : n);
//   return now.getFullYear() + ':' +
//     pad(now.getMonth() + 1) + ':' +
//     pad(now.getDate()) + '-' +
//     pad(now.getHours()) + ':' +
//     pad(now.getMinutes()) + ':' +
//     pad(now.getSeconds());
// }

// // POST TO SERVER
// $('#wf-form-Payment-Form').submit(function (e) {
//   e.preventDefault();
//   const form = $(this);
//   const txndatetime = getFormattedTxndatetime();
//   form.find('[name="txndatetime"]').val(txndatetime);
//   const payload = {
//     chargetotal: form.find('[name="chargetotal"]').val(),
//     currency: form.find('[name="currency"]').val(),
//     storename: form.find('[name="storename"]').val(),
//     txndatetime: txndatetime,
//     txntype: form.find('[name="txntype"]').val(),
//     hash_algorithm: form.find('[name="hash_algorithm"]').val(),
//     responseSuccessURL: form.find('[name="responseSuccessURL"]').val(),
//     responseFailURL: form.find('[name="responseFailURL"]').val(),
//     transactionNotificationURL: form.find('[name="transactionNotificationURL"]').val() || '',
//     timezone: form.find('[name="timezone"]').val() || '',
//     checkoutoption: form.find('[name="checkoutoption"]').val() || ''
//   };

//   const sortedKeys = Object.keys(payload).sort((a, b) => a.localeCompare(b));
//   const stringToHash = sortedKeys.map(k => payload[k]).join('|');

//   // SEND DATA TO SERVER
//   $.ajax({
//     url: 'https://hook.eu1.make.com/bgcjovlxu12a5rtnc7esgtg9d3nfq6tb',
//     method: 'POST',
//     contentType: 'application/json',
//     data: JSON.stringify({ stringToHash }),
//     success: function (response) {
//       if (typeof response === 'string') {
//         response = JSON.parse(response);
//       }
//       form.find('[name="hashExtended"]').val(response.hashExtended);
//       form.off('submit').submit();
//     },
//     error: function () {
//       alert("Something went wrong generating the hash.");
//     }
//   });
// });

// // SHOW PARAMS ON SUCCESS OR FAILURE PAGE
// if ($("[chargetotal]").length > 0) {
//   const urlParams = new URLSearchParams(window.location.search);
//   // const payerName = urlParams.get('payerName');
//   // const payerEmail = urlParams.get('payerEmail');
//   // const payerPhone = urlParams.get('payerPhone');
//   // const patientName = urlParams.get('patientName');
//   // const patientDateOfBirth = urlParams.get('patientDateOfBirth');
//   const chargetotal = urlParams.get('chargetotal');
//   const oid = urlParams.get('oid');
//   const transactionid = urlParams.get('transactionid');

//   // $("[payerName]").text(payerName);
//   // $("[payerEmail]").text(payerEmail);
//   // $("[payerPhone]").text(payerPhone);
//   // $("[patientName]").text(patientName);
//   // $("[patientDateOfBirth]").text(patientDateOfBirth);
//   $("[chargetotal]").text(chargetotal);
//   $("[oid]").text(oid);
//   $("[transactionid]").text(transactionid);
// }
