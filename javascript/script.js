
// QR Code Generator UI & Logic
// Uses qrjs2 CDN for QR code generation


window.addEventListener('DOMContentLoaded', function() {
	const form = document.getElementById('qr-form');
	const urlInput = document.getElementById('qr-url');
	const preview = document.getElementById('qr-preview');
	const options = document.getElementById('qr-options');
	const previewCard = document.getElementById('qr-preview-card');

	if (!form || !urlInput || !preview || !options || !previewCard) {
		document.body.insertAdjacentHTML('afterbegin', '<div style="background:#c00;color:#fff;padding:12px;font-size:1.2rem;z-index:9999;position:fixed;top:0;left:0;width:100vw;text-align:center;">JS loaded, but one or more elements not found!<br>form: '+!!form+', urlInput: '+!!urlInput+', preview: '+!!preview+', options: '+!!options+', previewCard: '+!!previewCard+'</div>');
		return;
	} else {
		// Hide preview card initially
		previewCard.style.display = 'none';
		preview.innerHTML = '';
		preview.style.display = 'none';
		options.style.display = 'none';
	}

	let currentUrl = '';

	// Load QRCode.js library
	function loadQrLib(cb) {
		if (window.QRCode) {
			cb();
			return;
		}
		if (document.getElementById('qrcodejs-cdn')) {
			setTimeout(() => loadQrLib(cb), 300);
			return;
		}
		const script = document.createElement('script');
		script.id = 'qrcodejs-cdn';
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
		script.onload = cb;
		script.onerror = function() {
			preview.innerHTML = '<div style="color:#c00;font-weight:bold">Could not load QRCode.js library.</div>';
		};
		document.body.appendChild(script);
	}

	function showPreview(url) {
		loadQrLib(() => {
			try {
				// Show preview card
				previewCard.style.display = 'flex';
				preview.innerHTML = '';
				preview.style.display = 'flex';
				const qrDiv = document.createElement('div');
				qrDiv.id = 'qr-img-div';
				preview.appendChild(qrDiv);
				// Remove previous QRCode instance if any
				if (qrDiv.qrcodeInstance) {
					qrDiv.qrcodeInstance.clear();
				}
				qrDiv.innerHTML = '';
				const qr = new QRCode(qrDiv, {
					text: url,
					width: 200,
					height: 200,
					colorDark: '#222',
					colorLight: '#fff',
					correctLevel: QRCode.CorrectLevel.H
				});
				qrDiv.qrcodeInstance = qr;
				// Move options below QR preview
				previewCard.appendChild(options);
				options.style.display = 'flex';
				// Save SVG or PNG for download/copy
				setTimeout(() => {
					// Try to get the generated image
					const img = qrDiv.querySelector('img');
					if (img) {
						currentSvg = null;
						currentUrl = img.src;
					} else {
						const canvas = qrDiv.querySelector('canvas');
						if (canvas) {
							currentSvg = null;
							currentUrl = canvas.toDataURL('image/png');
						}
					}
				}, 500);
			} catch (err) {
				preview.innerHTML = '<div style="color:#c00;font-weight:bold">Error generating QR code.</div>';
			}
		});
	}

	urlInput.addEventListener('input', (e) => {
		const url = e.target.value.trim();
		currentUrl = url;
		if (url.length > 0) {
			showPreview(url);
		} else {
			previewCard.style.display = 'none';
			preview.innerHTML = '';
			preview.style.display = 'none';
			options.style.display = 'none';
		}
	});

	// Download helpers
	function download(dataUrl, filename) {
		const a = document.createElement('a');
		a.href = dataUrl;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}


	// Helper: show feedback tooltip
	function showTooltip(msg) {
		let tip = document.getElementById('qr-tooltip');
		if (!tip) {
			tip = document.createElement('div');
			tip.id = 'qr-tooltip';
			tip.className = 'qr-tooltip';
			document.body.appendChild(tip);
		}
		tip.textContent = msg;
		tip.style.opacity = '1';
		setTimeout(() => { tip.style.opacity = '0'; }, 1200);
	}

	// Helper: generate high-res QR code canvas
	function generateHighResQR(text, format, callback) {
		// Create a hidden div for high-res QR
		const tempDiv = document.createElement('div');
		tempDiv.style.position = 'absolute';
		tempDiv.style.left = '-9999px';
		document.body.appendChild(tempDiv);
		const qr = new QRCode(tempDiv, {
			text: text,
			width: 1024,
			height: 1024,
			colorDark: '#222',
			colorLight: '#fff',
			correctLevel: QRCode.CorrectLevel.H
		});
		setTimeout(() => {
			const img = tempDiv.querySelector('img');
			const canvas = tempDiv.querySelector('canvas');
			let dataUrl = null;
			if (format === 'png' && (img || canvas)) {
				dataUrl = img ? img.src : canvas.toDataURL('image/png');
				callback(dataUrl);
			} else if (format === 'jpg' && (img || canvas)) {
				if (canvas) {
					dataUrl = canvas.toDataURL('image/jpeg');
				} else if (img) {
					const tempCanvas = document.createElement('canvas');
					tempCanvas.width = img.width;
					tempCanvas.height = img.height;
					const ctx = tempCanvas.getContext('2d');
					ctx.fillStyle = '#fff';
					ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
					ctx.drawImage(img, 0, 0);
					dataUrl = tempCanvas.toDataURL('image/jpeg');
				}
				callback(dataUrl);
			} else if (format === 'copy' && (img || canvas)) {
				if (canvas) {
					canvas.toBlob(function(blob) {
						callback(blob);
					});
				} else if (img) {
					const tempCanvas = document.createElement('canvas');
					tempCanvas.width = img.width;
					tempCanvas.height = img.height;
					const ctx = tempCanvas.getContext('2d');
					ctx.drawImage(img, 0, 0);
					tempCanvas.toBlob(function(blob) {
						callback(blob);
					});
				}
			}
			document.body.removeChild(tempDiv);
		}, 500);
	}

	// Option buttons
	options.addEventListener('click', function(e) {
		if (!e.target.closest('.qr-btn')) return;
		const btn = e.target.closest('.qr-btn');
		const format = btn.dataset.format;
		// Get QR text from current input
		const qrText = document.getElementById('qr-url').value.trim();
		if (format === 'png') {
			showTooltip('Downloading PNG...');
			generateHighResQR(qrText, 'png', (dataUrl) => download(dataUrl, 'qrcode.png'));
		} else if (format === 'jpg') {
			showTooltip('Downloading JPG...');
			generateHighResQR(qrText, 'jpg', (dataUrl) => download(dataUrl, 'qrcode.jpg'));
		}
	});

	// Copy image
	document.getElementById('copy-img').addEventListener('click', function() {
		const qrText = document.getElementById('qr-url').value.trim();
		showTooltip('Copied!');
		generateHighResQR(qrText, 'copy', function(blob) {
			const item = new ClipboardItem({ 'image/png': blob });
			navigator.clipboard.write([item]);
		});
	});

	// Replace option buttons with icons
	// No icons, just text labels now
});
