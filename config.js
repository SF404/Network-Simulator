const { bus } = require('./Topologies/bus.json')
const { star } = require('./Topologies/star.json')
const { mesh } = require('./Topologies/mesh.json')
const { ring } = require('./Topologies/ring.json')
const { hybrid } = require('./Topologies/hybrid.json')

const dataFrame = {
    sourceMACAddress: "00:11:22:33:44:56",
    destinationMACAddress: "00:11:22:33:44:58",
    dataWord: '', // 4 bits 
};

const topology = star;

const errorProbability = 0.1;  // [0 - 1]

const dataPacket = {
    sourceIP: null,
    destinationIP: null,
    protocol: "TCP",
    // payload: "1000 0110 1100 1100 1111 0100 0010 1111 1111 1010 1100 0100 0001"
    payload: "1000 0110"
}

module.exports = { dataPacket, topology, dataFrame, errorProbability } 