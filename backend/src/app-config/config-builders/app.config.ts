export default () => {
    const configuration = {
        instance: process.env.INSTANCE || 'main-1',
    };
    return configuration;
};
