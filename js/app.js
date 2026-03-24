/* ================================================================
   App — Event listeners and boot
   ================================================================ */

// Close modal on overlay click
document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// Close modal on Escape, cancel inline add
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (qaOpen) closeModal();
    inlineAddCancel();
  }
});

// Boot
try { render(); } catch(e) { document.getElementById('view-experiments').style.display='block'; document.getElementById('view-experiments').innerHTML='<pre style="color:red">'+e.message+'\n'+e.stack+'</pre>'; }

// Auto-sync connected sources on load
syncAll(function(n) { if (n > 0) { showToast(n + ' sources synced'); render(); } });
