(function($) {
  /**
   * Aloha editor settings.
   @todo: add settings - seems to be having conflict with drupal?
   */
  Aloha.settings = {
    locale: 'en',
    plugins: {
      format: {
          editables : {
          '.plaintext'  : [ ]
          }
      },
      link: {
        editables : {
          '.plaintext'  : [  ]
          }
      },
      list: {
        editables : {
          '.plaintext'  : [  ]
          }
      },
      abbr: {
        editables : {
          '.plaintext'  : [  ]
          }
      },
      image: {
        editables : {
          '.plaintext'  : [  ]
          }
      }
    },
    sidebar: {
      disabled: true
    },
    // Aloha tends to throw an error sometimes without this.
    contentHandler: {}
  };

  /**
   * Add edit elements to page for Aloha editor.
   */
  Drupal.behaviors.driesNode = {
    attach: function(context, settings) {
      Aloha.ready(function() {
        $('body', context).prepend(Drupal.theme('driesElements'));
        $('#page-title', context).addClass('plaintext');
        //append .plaintext to actual field-items
        $.each($('.field.plaintext'), function(index, element) {
          $(this).children('.field-items').children('.field-item').addClass('plaintext');
        });
        var dries_plaintext = '*[class*=dries__]' + ' .plaintext:not(.field)';
        var dries_field_item = '*[class*=dries__]' + ' .field-item';
        $('#dries-edit', context)
          .slideDown()
          .click(function() {
            $(this).slideUp();
            $('#dries-save').slideDown();
            Aloha.jQuery(dries_plaintext).aloha();
            Aloha.jQuery(dries_field_item).aloha();
            $(dries_plaintext).css('background-color','white');
            $(dries_field_item).css('background-color','white');
            $('#dries-dim').show();
          });

        $('#dries-save', context)
          .click(function() {
            var nid = $('#dries-nid', context).val();
            var bundle = $('#dries-bundle', context).val();
            var values = {}
            values["title"] = trim11($('#page-title', context).html());

            // Match all dries-enabled fields.
            $('*[class*=dries__]', context).each(function(i, elem) {
              var classList = $(this).attr('class').split(' ');
              var key;
              $.each(classList, function(j, item) {
                if (item.indexOf('dries__') !== -1) {
                  key = item.replace('dries__', '');
                }
              });

              // Do the check here instead of inside the loop
              // to keep the correct context in tact.
              if (typeof key != 'undefined') {
                values[key] = {};
                values[key]['und'] = {}
                $('.field-item', this).each(function(k, elem) {
                  var field_value = $(this).html();
                  values[key]['und'][k] = {}
                  values[key]['und'][k]['format'] = 'full_html';
                  values[key]['und'][k]['value'] = field_value;
                });
              }
            });

            // Actual validation and submission.
            $.post(settings.basePath + 'dries/validate-fields/' + nid + '/' + bundle, { values: values }, function(data) {
              if (!data['pass']) {
                var error = '';
                $.each(data, function(i, v) {
                  if (i != 'pass') {
                    error += i + ': ' + v + "\n";
                  }
                });

                // Do a simple alert.
                dries_alert(error);
              }
              // Update entity when validation is passed.
              else {
                // ---
                entity_update('node', nid, values).done(function(data) {
                  $('#dries-save').slideUp();
                  $('#dries-dim').hide();
                  $('#dries-edit').slideDown();
                  $(dries_plaintext).removeClass('aloha-editable-highlight');
                  $(dries_field_item).removeClass('aloha-editable-highlight');
                  Aloha.jQuery(dries_plaintext).mahalo();
                  Aloha.jQuery(dries_field_item).mahalo();
                  $(dries_plaintext).css('background-color','inherit');
                  $(dries_field_item).css('background-color','inherit');
                });
                dries_alert('Saved!');
              }
            }, 'json');
          });
      });
    }
  }

  /**
   * Theme function that returns an overlay and buttons.
   */
  Drupal.theme.prototype.driesElements = function() {
    return '<div id="dries-dim"></div><input type="submit" id="dries-edit" class="dries-btn" value="' + Drupal.t('Edit') + '" /><input type="submit" class="dries-btn" id="dries-save" value="' + Drupal.t('Save') + '" />';
  }
})(jQuery);

function dries_alert(text) {
  return (function ($) {
    if ($('#dries-alert').length == 0) {
      $('body').prepend('<div id="dries-alert">' + text  + '</div>');
    } else {
      $('#dries-alert').html(text);
    }
    $('#dries-alert').show().delay(800).fadeOut(800);
  })(jQuery);
}

function trim11 (str) {
  str = str.replace(/^\s+/, '');
  for (var i = str.length - 1; i >= 0; i--) {
    if (/\S/.test(str.charAt(i))) {
      str = str.substring(0, i + 1);
      break;
    }
  }
  return str;
}
