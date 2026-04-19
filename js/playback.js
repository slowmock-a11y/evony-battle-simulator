var Playback = (function () {
    'use strict';

    let events = [];
    let currentIndex = 0;
    let isPlaying = false;
    let animationTimer = null;
    let onEventCallback = null;
    let onCompleteCallback = null;

    function load(battleEvents, onEvent, onComplete) {
        events = battleEvents;
        currentIndex = 0;
        isPlaying = false;
        clearTimeout(animationTimer);
        onEventCallback = onEvent;
        onCompleteCallback = onComplete;
    }

    function getSpeed() {
        return parseInt(document.getElementById('speed-slider').value, 10) || 200;
    }

    function _advance() {
        if (currentIndex >= events.length) {
            if (onCompleteCallback) onCompleteCallback();
            return false;
        }
        const evt = events[currentIndex];
        currentIndex++;
        if (onEventCallback) onEventCallback(evt, currentIndex, events.length);
        if (currentIndex >= events.length) {
            if (onCompleteCallback) onCompleteCallback();
        }
        return true;
    }

    function step() {
        stop();
        return _advance();
    }

    function playRound() {
        stop();
        if (currentIndex >= events.length) {
            if (onCompleteCallback) onCompleteCallback();
            return;
        }
        const targetRound = events[currentIndex].round;
        while (currentIndex < events.length && events[currentIndex].round === targetRound) {
            _advance();
        }
    }

    function playFull() {
        if (isPlaying) {
            stop();
            return;
        }
        isPlaying = true;

        function tick() {
            if (!isPlaying || currentIndex >= events.length) {
                isPlaying = false;
                return;
            }
            _advance();
            if (currentIndex < events.length) {
                animationTimer = setTimeout(tick, getSpeed());
            } else {
                isPlaying = false;
            }
        }
        tick();
    }

    function stop() {
        isPlaying = false;
        clearTimeout(animationTimer);
    }

    function reset() {
        stop();
        events = [];
        currentIndex = 0;
    }

    function isDone() {
        return currentIndex >= events.length;
    }

    function getProgress() {
        return { current: currentIndex, total: events.length };
    }

    function isAnimating() {
        return isPlaying;
    }

    return {
        load: load,
        step: step,
        playRound: playRound,
        playFull: playFull,
        stop: stop,
        reset: reset,
        isDone: isDone,
        getProgress: getProgress,
        isAnimating: isAnimating
    };
})();
