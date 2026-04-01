// Voishper Widget Loader - Universal Embed Script
(function() {
  var script = document.currentScript || document.querySelector('script[data-bot-id]');
  if (!script) return;
  
  var botId = script.getAttribute('data-bot-id');
  var host = script.getAttribute('data-host') || 'https://omni-whisper-ai.lovable.app';
  
  if (!botId) {
    console.error('Voishper: data-bot-id attribute is required');
    return;
  }

  // Create iframe container
  var container = document.createElement('div');
  container.id = 'voishper-widget-container';
  container.style.cssText = 'position:fixed;bottom:0;right:0;z-index:999999;pointer-events:none;';
  
  var iframe = document.createElement('iframe');
  iframe.src = host + '/widget/' + botId;
  iframe.style.cssText = 'width:420px;height:600px;border:none;background:transparent;pointer-events:auto;';
  iframe.setAttribute('allow', 'microphone');
  iframe.setAttribute('loading', 'lazy');
  
  container.appendChild(iframe);
  document.body.appendChild(container);
})();
