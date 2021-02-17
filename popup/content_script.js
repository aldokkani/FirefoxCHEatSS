browser.runtime.onMessage.addListener(message => {
    if (message.variant !== undefined) {
        console.log(`Variant: ${message.variant} has been set!`);
        sessionStorage.setItem('variant', message.variant);
    } else if (message.cheatOff !== undefined) {
        if (message.cheatOff) {
            sessionStorage.setItem('cheatOff', message.cheatOff);
        } else {
            sessionStorage.removeItem('cheatOff');
        }
        console.log(`Engine is on: ${!message.cheatOff}`);
    }
});
