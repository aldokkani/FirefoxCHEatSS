browser.runtime.onMessage.addListener((message) => {
    console.log(`Variant: ${message.variant} has been set!`);
    sessionStorage.setItem('variant', message.variant)
});
