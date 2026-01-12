const getIceServers = () => {
    const iceServers = [
        // Free STUN servers
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
    ];

    // Add TURN servers if configured
    if (process.env.TURN_SERVERS) {
        try {
            const turnServers = JSON.parse(process.env.TURN_SERVERS);
            iceServers.push(...turnServers);
        } catch (e) {
            console.error('Error parsing TURN servers:', e);
        }
    }

    return iceServers;
};

const webrtcConfig = {
    iceServers: getIceServers(),
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    sdpSemantics: 'unified-plan'
};

export default webrtcConfig;