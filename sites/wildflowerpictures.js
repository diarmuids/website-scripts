// Last updated: 2026-11-16 18:30:30

// Wildflower Pictures site script. Loaded in Site settings > Custom code > Footer.

// -------------------------------------------------------
// BASIN HIDDEN FIELDS - "Form" (from the form's name) AND "_gotcha" HONEYPOT
// -------------------------------------------------------
$('form[action^="https://usebasin.com"]').each(function () {
  var f = $(this);
  if (!f.find('input[name="Form"]').length) {
    f.prepend($('<input type="hidden" name="Form">').val(f.attr('data-name')));
  }
  if (!f.find('input[name="_gotcha"]').length) {
    f.prepend('<input type="hidden" name="_gotcha" value="">');
  }
});

// -------------------------------------------------------
// 3RD PARTY FORM - WITH FILE UPLOAD AND NATIVE INTERACTIONS
// ---------------------------------------------------------

$('form[action^="https://usebasin.com"]').each(function (i, el) {
  form = $(el);
  form.submit(function (e) {
    // STOP THE FORM FROM SUBMITTING
    e.preventDefault();

    $(this)
      .find('input')
      .each(function () {
        if ($(this).val() == '') {
          $(this).remove();
        }
      });

    form = $(e.target);
    // GET THE FORM'S ACTION PARAMETER AND ADD ".JSON" TO THE END
    action = form.attr('action') + '.json';
    // DISABLE ALL BUTTONS IN FORM
    $(e.target).find('input[type=submit]').attr('disabled', true);
    // GET REDIRECT URL
    var dataRedirect = $(e.target).attr('redirect');
    // GET & SET "WAITING TEXT" FROM BUTTON - I.E. "SENDING..." ONCE FORM IS BEING SUBMITTED
    var dataSubmitText = $(e.target).find('input[type=submit]').attr('value');
    var dataWait = $(e.target).find('input[type=submit]').attr('data-wait');
    $(e.target).find('input[type=submit]').attr('value', dataWait);

    // Modify FormData
    let formData = new FormData(this);
    let fileCount = 1; // Initialize file counter
    let newFormData = new FormData(); // Create new FormData object to ensure proper ordering

    // Append incremented numbers to each file's name
    formData.forEach((value, key) => {
      if (value instanceof File) {
        let fileExtension = value.name.split('.').pop(); // Extract file extension
        let baseName = value.name.replace(/\.[^/.]+$/, ''); // Remove file extension
        let newFileName = `${String(fileCount).padStart(2, '0')}-${baseName}.${fileExtension}`; // Add incremented counter
        let newFile = new File([value], newFileName, { type: value.type });
        newFormData.append(key, newFile); // Add modified file to the new FormData
        fileCount++; // Increment the counter
      } else {
        newFormData.append(key, value); // Add non-file fields unchanged
      }
    });

    // SUBMIT THE FORM VIA AJAX
    $.ajax({
      url: action,
      method: 'POST',
      dataType: 'JSON',
      data: newFormData,
      processData: false,
      contentType: false,
      success: function (data) {
        if (data.success) {
          if (dataRedirect !== undefined) {
            // SUCCESSFUL SUBMISSION - REDIRECT TO PAGE (IF SET)
            window.location.href = dataRedirect;
          } else {
            // SUCCESSFUL SUBMISSION - HIDE THE FORM AND SHOW THE SUCCESS MESSAGE
            $(form).css('display', 'none');
            $(form).siblings('.w-form-done').css('display', 'block');
            $(form).siblings('.w-form-fail').css('display', 'none');
            // ENABLE ALL BUTTONS IN FORM
            $(form).find('input[type=submit]').attr('disabled', false);
            $(form).find('input[type=submit]').attr('value', dataSubmitText);
          }
        } else {
          // FAILED SUBMISSION - LOG THE OUTPUT TO THE CONSOLE AND SHOW THE FAILURE MESSAGE
          console.log(data);
          $(form).siblings('.w-form-fail').css('display', 'block');
          // ENABLE ALL BUTTONS IN FORM
          $(form).find('input[type=submit]').attr('disabled', false);
          $(form).find('input[type=submit]').attr('value', dataSubmitText);
        }
      },
      error: function () {
        // FAILED SUBMISSION - SHOW THE FAILURE MESSAGE
        $(form).siblings('.w-form-fail').css('display', 'block');
        // ENABLE ALL BUTTONS IN FORM
        $(form).find('input[type=submit]').attr('disabled', false);
      },
    });
  });
});
