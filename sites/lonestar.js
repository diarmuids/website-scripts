// Last updated: 2026-07-17 17:45:37 +01:00

$(document).ready(function () {
  $('[data-field="duration"]').hide().find('input, select, textarea').prop('required', false);
  $('input[name="Type"]').on('change', function () {
    if ($('[data-field="rental"]').is(':checked')) {
      $('[data-field="duration"]').show().find('input').prop('required',
        true);
    } else {
      $('[data-field="duration"]').hide().find('input').prop('required',
        false);
    }
  });
});
