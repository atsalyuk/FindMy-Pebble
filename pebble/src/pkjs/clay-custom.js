"use strict";

/**
 * Clay custom function for FindMy for Pebble settings page.
 * Serialized via .toString() — no require() or closures allowed.
 *
 * userData: { configStage, appleId, distanceUnit, devices, launchDeviceId,
 *             pendingMode, pendingNotice }
 *
 * Every action closes with a Clay-shaped payload so the phone app and PKJS
 * both see declared message keys instead of ad hoc objects.
 */
module.exports = function (minified) {
  var clayConfig = this;
  var userData = clayConfig.meta.userData || {};
  clayConfig.on(clayConfig.EVENTS.AFTER_BUILD, function () {
    // Prevent iOS WebKit from auto-zooming the config page when a form field
    // (e.g. the logs textarea) gains focus.
    if (typeof document !== 'undefined' && document.head) {
      var vp = document.querySelector('meta[name=viewport]');
      if (!vp) {
        vp = document.createElement('meta');
        vp.setAttribute('name', 'viewport');
        document.head.appendChild(vp);
      }
      vp.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    }
    var signInBtn = clayConfig.getItemById('sign-in-btn');
    var verifyBtn = clayConfig.getItemById('verify-btn');
    var subtitle = clayConfig.getItemById('subtitle');
    var logsWidget = clayConfig.getItemById('logs-widget');
    var smsBtn = clayConfig.getItemById('sms-btn');
    var signOutBtn = clayConfig.getItemById('sign-out-btn');
    var launchDeviceWidget = clayConfig.getItemById('launch-device-widget');
    var resetAllBtn = clayConfig.getItemById('reset-all-btn');
    var distanceUnitText = clayConfig.getItemById('distance-unit-text');
    var milesBtn = clayConfig.getItemById('distance-unit-miles-btn');
    var kilometersBtn = clayConfig.getItemById('distance-unit-kilometers-btn');
    var signedInText = clayConfig.getItemById('signed-in-text');
    var verifyNotice = clayConfig.getItemById('verify-notice');
    var loginNote = clayConfig.getItemById('login-note');
    var busyNote = clayConfig.getItemById('busy-note');
    var appleIdInput = clayConfig.getItemByMessageKey('appleId');
    var passwordInput = clayConfig.getItemByMessageKey('password');
    var codeInput = clayConfig.getItemByMessageKey('twoFactorCode');
    var configStage = userData.configStage || 'credentials';
    var hasPending = configStage === 'verify';
    var hasSession = configStage === 'complete';
    var isBusy = configStage === 'busy';
    var appleId = userData.appleId || '';
    var distanceUnit = userData.distanceUnit === 'kilometers' ? 'kilometers' : 'miles';
    var pendingMode = userData.pendingMode || '';
    var pendingNotice = userData.pendingNotice || 'Enter your Apple verification code.';
    var loginError = userData.loginError || '';
    // Pre-fill Apple ID from stored settings
    if (appleId && appleIdInput) {
      appleIdInput.set(appleId);
    }

    // A clean step card: colored pill + one short line of guidance.
    var stepCard = function stepCard(color, label, body) {
      return '<div style="background:#f2f2f7;border-radius:12px;padding:12px 14px;margin:0 0 6px;text-align:left">' + '<span style="display:inline-block;background:' + color + ';color:#fff;border-radius:999px;padding:3px 11px;font-size:12px;font-weight:700;letter-spacing:.2px">' + label + '</span>' + '<p style="margin:8px 0 0;font-size:14px;color:#3c3c43;line-height:1.45">' + body + '</p>' + '</div>';
    };

    // Update subtitle based on state
    if (subtitle) {
      if (isBusy) {
        subtitle.set('Please wait');
      } else if (hasPending) {
        subtitle.set('Verify your identity');
      } else if (hasSession) {
        subtitle.set('Signed in');
      } else {
        subtitle.set('Sign in to your Apple Account');
      }
    }

    // Busy / "please wait" page shown while an operation is running.
    if (busyNote && isBusy) {
      busyNote.set(stepCard('#8e8e93', 'Working…', 'Finishing the previous step. Please <strong>close this page and reopen it</strong> in a few seconds.'));
    }

    // Step 1 card on the credentials page — makes the two-step flow explicit.
    // If a previous attempt failed, show the reason above it in red.
    if (loginNote) {
      var errorCard = loginError ? '<div style="background:#ffecec;border-radius:12px;padding:10px 14px;margin:0 0 8px;text-align:left">' + '<p style="margin:0;font-size:14px;color:#c0362c;line-height:1.4">' + loginError + '</p></div>' : '';
      loginNote.set(errorCard + stepCard('#007aff', 'Step 1 of 2', 'Sign in below. We&#39;ll text a code to your phone, then you&#39;ll <strong>reopen this Settings page</strong> to enter it.'));
    }

    // Step 2 card on the verify page.
    if (verifyNotice && hasPending) {
      verifyNotice.set(stepCard('#34c759', 'Step 2 of 2', pendingNotice));
    }

    // Show signed-in email
    if (signedInText && hasSession) {
      signedInText.set('<div style="font-size:14px;color:#8e8e93;text-align:center;padding:8px 0">Signed in as <strong>' + appleId + '</strong></div>');
    }

    // "Open at launch" picker — choose the cached device the watch app opens
    // straight into, or "Device list" for the normal list-first behavior.
    // Each tap closes the page with a set_launch_device action, matching how
    // the other one-tap settings (distance unit, sign out) work.
    if (launchDeviceWidget && hasSession && typeof document !== 'undefined') {
      var devices = Array.isArray(userData.devices) ? userData.devices : [];
      var escapeHtml = function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
          return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          }[ch];
        });
      };
      var storedLaunchId = String(userData.launchDeviceId || '');
      // Treat a stored id that no longer matches a cached device as "Device list".
      var activeLaunchId = '';
      for (var di = 0; di < devices.length; di++) {
        if (devices[di] && String(devices[di].id || '') === storedLaunchId) {
          activeLaunchId = storedLaunchId;
          break;
        }
      }
      // Styled to blend with Clay's dark settings pane (#414141 section on
      // #333 page): transparent rows, #484848 dividers, white labels, gray
      // secondary text, and Clay-orange radio dots — like a native radiogroup.
      var launchRow = function launchRow(id, label, sublabel, checked, first) {
        return '<div data-launch-id="' + escapeHtml(id) + '" style="display:flex;align-items:center;justify-content:space-between;padding:10px 2px;cursor:pointer' + (first ? '' : ';border-top:1px solid #484848') + '">' + '<span style="font-size:16px;color:#ffffff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:10px">' + escapeHtml(label) + (sublabel ? ' <span style="color:#a4a4a4;font-size:13px">' + sublabel + '</span>' : '') + '</span>' + '<span style="flex:none;box-sizing:border-box;width:18px;height:18px;border-radius:50%;border:2px solid ' + (checked ? '#ff4700' : '#767676') + ';background:' + (checked ? '#ff4700' : 'transparent') + ';display:flex;align-items:center;justify-content:center">' + (checked ? '<span style="width:7px;height:7px;border-radius:50%;background:#ffffff"></span>' : '') + '</span>' + '</div>';
      };
      var rows = launchRow('', 'Device list', 'default', activeLaunchId === '', true);
      for (var ri = 0; ri < devices.length; ri++) {
        var dev = devices[ri] || {};
        var devId = String(dev.id || '');
        if (!devId) continue;
        rows += launchRow(devId, String(dev.name || 'Unnamed device'), '', activeLaunchId === devId, false);
      }
      var emptyHint = devices.length === 0 ? '<p style="margin:4px 0 0;font-size:12px;color:#a4a4a4">Your devices will appear here after the watch app syncs once.</p>' : '';
      launchDeviceWidget.set('<div style="margin:2px 0 8px;text-align:left">' + '<p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#a4a4a4;text-transform:uppercase;letter-spacing:.4px">Open at launch</p>' + '<div id="launch-device-list">' + rows + '</div>' + emptyHint + '<p style="margin:4px 0 0;font-size:12px;color:#858585">The watch app will open straight into this device.</p>' + '</div>');
      var launchListEl = document.getElementById('launch-device-list');
      if (launchListEl) {
        launchListEl.addEventListener('click', function (event) {
          prevent(event);
          var node = event.target;
          while (node && node !== launchListEl && !(node.hasAttribute && node.hasAttribute('data-launch-id'))) {
            node = node.parentNode;
          }
          if (!node || node === launchListEl || !node.hasAttribute || !node.hasAttribute('data-launch-id')) {
            return;
          }
          closeWith(clayPayload('set_launch_device', {
            launchDeviceId: node.getAttribute('data-launch-id') || ''
          }));
        });
      }
    }
    if (distanceUnitText) {
      distanceUnitText.set('<p style="text-align:center;color:#8e8e93">Distance units: <strong>' + (distanceUnit === 'kilometers' ? 'Kilometers' : 'Miles') + '</strong></p>');
    }
    var prevent = function prevent(event) {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
    };
    var getValue = function getValue(item) {
      return item && typeof item.get === 'function' ? String(item.get() || '') : '';
    };
    var clayPayload = function clayPayload(action, extras) {
      var payload = {
        action: {
          value: action
        }
      };
      Object.keys(extras || {}).forEach(function (key) {
        payload[key] = {
          value: extras[key]
        };
      });
      return payload;
    };
    function closeWith(payload) {
      var encoded = encodeURIComponent(JSON.stringify(payload));
      var returnTo = 'pebblejs://close#';
      if (typeof location !== 'undefined' && location && typeof location.search === 'string') {
        var query = location.search.substring(1).split('&');
        for (var i = 0; i < query.length; i++) {
          var pair = query[i].split('=');
          if (pair[0] === 'return_to' && pair.length > 1) {
            returnTo = decodeURIComponent(pair[1]);
            break;
          }
        }
      }
      if (returnTo === 'pebblejs://close#' && typeof window !== 'undefined' && window.returnTo) {
        returnTo = window.returnTo;
      }
      location.href = returnTo + encoded;
    }
    if (signInBtn) {
      signInBtn.on('click', function (event) {
        prevent(event);
        closeWith(clayPayload('login_start', {
          appleId: getValue(appleIdInput).trim(),
          password: getValue(passwordInput)
        }));
      });
    }
    if (verifyBtn) {
      verifyBtn.on('click', function (event) {
        prevent(event);
        closeWith(clayPayload('login_verify_2fa', {
          twoFactorCode: getValue(codeInput).trim()
        }));
      });
    }
    // In-page collapsible logs viewer with copy-to-clipboard (no email/leaving).
    if (logsWidget && typeof document !== 'undefined') {
      logsWidget.set('<div style="margin-top:6px;text-align:center">' + '<button type="button" id="logs-toggle" style="background:none;border:none;color:#007aff;font-size:15px;font-weight:600;padding:6px">Show logs</button>' + '<div id="logs-box" style="display:none;margin-top:8px;text-align:left">' + '<textarea id="logs-text" readonly wrap="off" style="width:100%;box-sizing:border-box;height:200px;font-size:11px;font-family:monospace;background:#1c1c1e;color:#e5e5ea;border:1px solid #3a3a3c;border-radius:8px;padding:8px"></textarea>' + '<div style="text-align:center;margin-top:6px"><button type="button" id="logs-copy" style="background:#007aff;color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:14px;font-weight:600">Copy logs</button></div>' + '<p style="font-size:11px;color:#8e8e93;text-align:center;margin:6px 0 0">Sanitized — passwords, tokens, and cookies are redacted.</p>' + '</div>' + '</div>');
      var boxEl = document.getElementById('logs-box');
      var toggleEl = document.getElementById('logs-toggle');
      var textEl = document.getElementById('logs-text');
      var copyEl = document.getElementById('logs-copy');
      if (textEl) {
        textEl.value = userData.logs || 'No logs recorded yet.';
      }
      if (toggleEl && boxEl) {
        toggleEl.addEventListener('click', function () {
          var hidden = boxEl.style.display === 'none';
          boxEl.style.display = hidden ? 'block' : 'none';
          toggleEl.textContent = hidden ? 'Hide logs' : 'Show logs';
        });
      }
      if (copyEl && textEl) {
        copyEl.addEventListener('click', function () {
          var flash = function flash() {
            copyEl.textContent = 'Copied!';
            setTimeout(function () {
              copyEl.textContent = 'Copy logs';
            }, 1500);
          };
          // Prefer the clipboard API — it copies without focusing/selecting the
          // textarea, so iOS doesn't zoom. Fall back to select+execCommand.
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textEl.value).then(flash, function () {
              try {
                textEl.select();
                document.execCommand('copy');
              } catch (e) {}
              flash();
            });
          } else {
            try {
              textEl.select();
              document.execCommand('copy');
            } catch (e) {}
            flash();
          }
        });
      }
    }
    if (smsBtn) {
      smsBtn.on('click', function (event) {
        prevent(event);
        closeWith(clayPayload('request_2fa_sms', {}));
      });
    }
    if (signOutBtn) {
      signOutBtn.on('click', function (event) {
        prevent(event);
        closeWith(clayPayload('clear', {}));
      });
    }
    if (resetAllBtn) {
      resetAllBtn.on('click', function (event) {
        prevent(event);
        closeWith(clayPayload('reset_all', {}));
      });
    }
    if (milesBtn) {
      milesBtn.on('click', function (event) {
        prevent(event);
        closeWith(clayPayload('set_distance_unit', {
          distanceUnit: 'miles'
        }));
      });
    }
    if (kilometersBtn) {
      kilometersBtn.on('click', function (event) {
        prevent(event);
        closeWith(clayPayload('set_distance_unit', {
          distanceUnit: 'kilometers'
        }));
      });
    }
  });
};