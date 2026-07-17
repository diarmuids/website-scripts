$('#original-svg').on('input', function () { let a = $(this),
    b = a.val().replace(/<!--[\s\S]*?-->/g, ''),
    c = $($.parseHTML(b));
  c.removeAttr('width height fill').attr({ width: '100%', height: '100%', fill: 'none' });
  c.find('path,rect,circle,ellipse,polygon,polyline,line').each(function () { let d = $(this),
      e = d.attr('style') || '',
      f = d.is('[stroke]'),
      g = /(?:^|;)\s*stroke\s*:/.test(e);
    d.attr('fill', 'currentColor');
    (f || g) && d.attr('stroke', 'currentColor');
    g && d.attr('style', e.replace(/(^|;)\s*stroke\s*:\s*[^;]*/i,
      '$1 stroke: currentColor')) }); let d = $('<div>').append(c).html();
  $('#modified-svg').val(d);
  (() => { let e = $('<textarea>');
    $('body').append(e);
    e.val(d).select(); try { document.execCommand('copy'), $('.popup-success-message').show()
        .delay(500).fadeOut() } catch (f) { console.error('Error copying SVG to clipboard: ',
        f) } e.remove();
    setTimeout(() => a.focus(), 0) })() });
$('#modified-svg').on('click', function () { let a = $(this).val(),
    b = $('<textarea>');
  $('body').append(b);
  b.val(a).select(); try { document.execCommand('copy'), $('.popup-success-message').show()
      .delay(500).fadeOut() } catch (c) { console.error('Error copying SVG to clipboard: ',
    c) } b.remove() });
