M.onReady(function(evt){
    var cnt = 0;
    var interval = setInterval(function() {
    	UpdateResourceFilesOnProgress(cnt);
    	cnt++;
    	if ( cnt == 100 ) {
    		clearInterval(interval);
    		screenManager.moveToPage('login.html', { action: 'CLEAR_TOP' });
    	}
    }, 10);
});

function UpdateResourceFilesOnProgress(percentage) {
	if (percentage == 0)
		progressBar.style.width = '0%';
	else
		progressBar.style.width = percentage + '%';
	progressPersent.innerHTML = percentage + '';
}