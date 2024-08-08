module.exports = (admCode, hash, clickPixelURL) => {
    const _hash = `${hash}_cl`;

    return `<span id="wrapper_${_hash}">${admCode}<script type='text/javascript'>(function() {var cld = 0;function scl() {if (cld == 0) {cld = 1;} else {return true;}var red = '';if (document.getElementById('wrapper_${_hash}').getElementsByTagName('a')[0] != undefined && document.getElementById('wrapper_${_hash}').getElementsByTagName('a')[0].target != '_blank'){red = document.getElementById('wrapper_${_hash}').getElementsByTagName('a')[0].href;}var x = document.getElementsByTagName('script')[0];var clickTrackers = ["${clickPixelURL}"];for (var i = 0; i < clickTrackers.length; i++){var s = document.createElement('script');s.type = 'text/javascript';s.async = true;s.src = clickTrackers[i];x.parentNode.insertBefore(s, x);};if (red != undefined && red != '') {setTimeout(function() {document.location = red;}, 200);return false;};var element = document.querySelectorAll('#wrapper_${_hash}');for (var i = 0; i < element.length; i++) {element[i].onclick = scl;}})();</script></span>`;

    // return `<div id="wrapper_${_hash}">${admCode}</div>` + `
    //     <script type="application/javascript">
    //         (function () {
    //             var cl = false;
    //             var e = document.querySelectorAll('#wrapper_${_hash}');
    //
    //             for (var i = 0; i < e.length; ++i) {
    //                 e[i].onclick = onEventClicked;
    //             }
    //
    //             function onEventClicked () {
    //                 if (cl) return;
    //                 cl = true;
    //
    //                 var x = document.getElementById('wrapper_${_hash}');
    //                 var s = document.createElement('script');
    //
    //                 s.type = 'text/javascript';
    //                 s.async = true;
    //                 s.src = '${clickPixelURL}';
    //                 x.parentNode.insertBefore(s, x);
    //             }
    //         })();
    //     </script>`.replace(/\n/g, '').replace(/ {2}/g, '');
};
