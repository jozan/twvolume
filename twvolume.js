function log(...args) {
    console.log('[TWVOLUME] ', ...args)
}

function findElementParent(element, selector) {
    if (element.matches(selector)) {
        return element;
    }

    if (element.parentNode) {
        return findElementParent(element.parentNode, selector);
    }

    return null;
}

function findElementOrFail(selector, logMessage, attempt = 0, maxAttempts = 100) {
    return new Promise((resolve, reject) => {
        const find = () => {
            if (attempt >= maxAttempts) {
                reject(new Error('Exceeded maximum number of attempts to find element'));
                return;
            }

            const element = document.querySelector(selector);
            if (element) {
                log(logMessage, element);
                resolve(element);
            } else {
                setTimeout(() => {
                    attempt++;
                    find();
                }, 250);
            }
        };

        find();
    });
}

function clamp(value, min = 0, max = 1) {
    return Math.min(Math.max(value, min), max);
}

(async () => {
    try {
        const [videoPlayer, overlay] = await Promise.all([
            findElementOrFail('video[playsinline=""][webkit-playsinline=""][src^="blob"]', 'found video player:'),
            findElementOrFail('div[data-a-target="player-overlay-click-handler"]', 'found overlay:'),
        ])

        const scrollable = findElementParent(videoPlayer, 'div.simplebar-scroll-content');

        const volumeDisplay = document.createElement('div');

        let oldScrollableOverFlow = scrollable.style.overflow;
        let oldScrollableHeight = scrollable.style.height;


        overlay.addEventListener('mouseenter', () => {
            oldScrollableOverFlow = scrollable.style.overflow;
            oldScrollableHeight = scrollable.style.height;

            scrollable.style.overflow = 'hidden';
            scrollable.style.height = '100%';

            volumeDisplay.textContent = Math.round(videoPlayer.volume * 100) + '%';
            volumeDisplay.style.position = 'fixed';
            volumeDisplay.style.top = '10px';
            volumeDisplay.style.right = '10px';
            volumeDisplay.style.backgroundColor = 'rgba(0, 0, 0, 1)';
            volumeDisplay.style.color = 'white';
            volumeDisplay.style.padding = '6px 12px';
            volumeDisplay.style.borderRadius = '5px';
            volumeDisplay.style.fontFamily = 'monospace';
            volumeDisplay.style.fontWeight = 'bold';
            volumeDisplay.style.zIndex = '9999';
            volumeDisplay.style.pointerEvents = 'none';

            document.body.appendChild(volumeDisplay);
        })

        overlay.addEventListener('mouseleave', () => {
            scrollable.style.overflow = oldScrollableOverFlow
            scrollable.style.height = oldScrollableHeight

            document.body.removeChild(volumeDisplay)
        })

        document.body.addEventListener('wheel', (event) => {
            if (event.target === videoPlayer || event.target === videoPlayer.parentNode || event.target === overlay) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                if (event.wheelDelta < 0) {
                    if (videoPlayer.volume > 0) {
                        videoPlayer.volume = clamp(videoPlayer.volume - 0.02);
                    }
                } else {
                    if (videoPlayer.volume < 1) {
                        videoPlayer.volume = clamp(videoPlayer.volume + 0.02);
                    }
                }

                volumeDisplay.textContent = Math.round(videoPlayer.volume * 100) + '%';
            }
        });

    } catch (e) {
        log('error happened')
        console.error(e)
    }
})()
