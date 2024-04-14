const { dataPacket, topology, dataFrame, errorProbability } = require('./config')

let statusTracker = [];
let status = '';

let payloadReceived = '';

function flipRandomBit(codeWord) {
    const codeWordBits = codeWord.split('');
    const noiseyCodeWordBits = new Array(7).fill(0);
    for (let i = 0; i < 7; i++) {
        noiseyCodeWordBits[i] = codeWordBits[i];
        if (Math.random() < errorProbability) {
            noiseyCodeWordBits[i] = (codeWordBits[i] + 1) % 2;
        }
    }
    const noiseyCodeWord = noiseyCodeWordBits.join('');
    return noiseyCodeWord;
}

function sendFrame(frame) {
    frame.codeWord = flipRandomBit(frame.codeWord);
    const { sourceMac, destinationMac, codeWord, EtherType } = frame;
    const visited = new Set();

    function destinationFound(nodePorts, destinationMac) {

        {
            status = `\t\tchecking Ports for destination `
            statusTracker.push(status)
            status = '';
        }

        for (const portId in nodePorts) {
            {
                status = `\t\t- ${portId}:\t ${nodePorts[portId]}`
                statusTracker.push(status);
            }
            if (destinationMac === nodePorts[portId]) {
                {
                    status = `\t\tforwarding to -->  \t${portId}:\t ${nodePorts[portId]}`
                    statusTracker.push(status);
                }
                return portId;
            }
        }
        {
            status = `\t\tdestination Not Found at the device port(s)`;
            statusTracker.push(status);
        }
        return null;
    }

    function forwardAllPorts(nodePorts) {
        {
            status = `\t\tforwarding to all Ports...`;
            statusTracker.push(status);
        }
        let targetFound = null;
        for (const portId in nodePorts) {
            const nextmacAddress = nodePorts[portId];
            if (!visited.has(nextmacAddress)) {
                const targetNode = getNode(nextmacAddress)
                const foundNode = traverse(targetNode);
                if (foundNode) {
                    targetFound = foundNode;
                }
            }
        }
        return targetFound;
    }

    function traverse(node) {

        const { macAddress, nodePorts, nodeName, nodeBuffer, nodeType } = node;

        {
            status = `\n\t--> MAC: ${macAddress} \tName: ${nodeName} \tType: ${nodeType}`;
            statusTracker.push(status);
        }

        visited.add(macAddress);

        if (nodeType !== "Hub") {
            node.nodeBuffer = Object.assign({}, frame);
        }

        switch (nodeType) {
            case "Computer":
                if (macAddress === destinationMac) {
                    {
                        status =
                            `\t\t\t+------------------------+\n` +
                            `\t\t\t|       Destination      |\n` +
                            `\t\t\t+------------------------+\n`;
                        statusTracker.push(status);
                        {
                            status = `\t\t\t+Destination Node+`;
                            statusTracker.push(status);
                            status =
                                `\t\t\tNode Name:\t ${node.nodeName}\n` +
                                `\t\t\tNode MAC:\t ${node.macAddress}\n` +
                                `\t\t\tNode Buffer:\t ${JSON.stringify(node.nodeBuffer)}\n`;
                            statusTracker.push(status);
                            status = `\t\t\tFrame received...`;
                            statusTracker.push(status);
                        }
                    }
                    return node;
                }
                else {
                    const targetPort = destinationFound(nodePorts, destinationMac)
                    if (targetPort) {
                        const targetNode = getNode(nodePorts[targetPort])
                        return traverse(targetNode);
                    }
                    else {
                        return forwardAllPorts(nodePorts)
                    }
                }
            case "Switch":
                {
                    status = `\t\tReading Frame...\n\t\tFrame: ${JSON.stringify(node.nodeBuffer)}`;
                    statusTracker.push(status);
                }
                const targetPort = destinationFound(nodePorts, destinationMac)
                if (targetPort) {
                    const targetNode = getNode(nodePorts[targetPort])
                    return traverse(targetNode);
                }
                else {
                    return forwardAllPorts(nodePorts)
                }
            case "Hub":
                {
                    status = '';
                    for (const portId in nodePorts) {
                        status += `\t\t- ${portId}:\t ${nodePorts[portId]}\n`
                    }
                    statusTracker.push(status)
                }
                return forwardAllPorts(nodePorts)
            default:
                console.warn(`Unknown node type: ${nodeType}`);
        }

        return null;
    }

    const sourceNode = getNode(sourceMac);
    if (!sourceNode) {
        console.error(`Source node with ID ${sourceMac} not found`);
        return null;
    }

    return traverse(sourceNode);
}

const nodes = [...topology];

function getNode(macAddress) {
    return nodes.find((n) => n.macAddress === macAddress)
}

const source_macAddress = dataFrame.sourceMACAddress;
const destination_macAddress = dataFrame.destinationMACAddress;

const sourceNode = getNode(source_macAddress);
const destinationNode = getNode(destination_macAddress);

{
    status =
        `-------------------------------------------------------\n` +
        `Source: \t ${sourceNode.nodeName} \t MAC: ${sourceNode.macAddress}\nDestination: \t ${destinationNode.nodeName} \t MAC: ${destinationNode.macAddress}` +
        `\n-------------------------------------------------------`;
    statusTracker.push(status)
}

function parityCheckAndCorrect(codeWord) {
    const codeWordBits = codeWord.split('');
    const P = new Array(3).fill(0);
    const dn = 4, hn = 7;
    //P1
    P[0] = codeWordBits[hn - 1] ^ codeWordBits[hn - 3] ^ codeWordBits[hn - 5] ^ codeWordBits[hn - 7];
    //P2
    P[1] = codeWordBits[hn - 2] ^ codeWordBits[hn - 3] ^ codeWordBits[hn - 6] ^ codeWordBits[hn - 7];
    //P3
    P[2] = codeWordBits[hn - 4] ^ codeWordBits[hn - 5] ^ codeWordBits[hn - 6] ^ codeWordBits[hn - 7];

    const errorPosition = parseInt(P.join(''), 2);
    if (errorPosition) {
        {
            status = `\tError detected at ${errorPosition} bit\n\tcorrecting Codeword...`;
            statusTracker.push(status);
        }
        codeWordBits[hn - errorPosition] = ~codeWordBits[hn - errorPosition] & 1; // flip all the bits
        {
            status = `\tCorrected Codeword: ${codeWordBits}\n\textracting Dataword...`;
            statusTracker.push(status);
        }
        return codeWordBits.join('');
    }
    else {
        {
            status = `\tDataword is error free`;
            statusTracker.push(status);
        }
        return codeWord;
    }

}

function receiveFrame(frame) {
    {
        status = `\n\t---------------` + `Data Link Layer` + `---------------\n`;
        statusTracker.push(status);
        status = `\tCodeword: ${frame.codeWord} `;
        statusTracker.push(status);
        status = `\tchecking for errors...`;
        statusTracker.push(status);
    }
    const codeWord = parityCheckAndCorrect(frame.codeWord);
    const codeWordbits = codeWord.split('');
    const dataWordBits = new Array(4).fill(0);
    const hn = 7, dn = 4;
    dataWordBits[dn - 1] = codeWordbits[hn - 3]
    dataWordBits[dn - 2] = codeWordbits[hn - 5]
    dataWordBits[dn - 3] = codeWordbits[hn - 6]
    dataWordBits[dn - 4] = codeWordbits[hn - 7]

    const dataWord = dataWordBits.join('');

    payloadReceived += (dataWord + " ")

    {
        status = `\tDataword: ${dataWord}`;
        statusTracker.push(status);
    }
}


function dataLinkLayer(dataPacket) {
    {
        status = `---------------` + `Data Link Layer` + `---------------\n`;
        statusTracker.push(status);
        status =
            `Data Packet Received from Network Layer:\n` +
            `Source IP:\t ${dataPacket.sourceIP}\n` +
            `Destination IP:\t ${dataPacket.destinationIP}\n` +
            `Protocol:\t ${dataPacket.protocol}\n` +
            `Payload:\t ${dataPacket.payload}\n`
            ;
        statusTracker.push(status);
    }

    const payload = dataPacket.payload;
    const dataWords = payload.split(' ');

    const getCodeWord = (dataWord) => {
        const dataWordBits = dataWord.split('');
        const hammingCode = new Array(7).fill(0);
        const dn = 4, hn = 7;
        // D4 D3 D2 P4 D1 P2 P1
        // 7  6  5  4  3  2  1
        // P1 
        hammingCode[hn - 1] = dataWordBits[dn - 1] ^ dataWordBits[dn - 2] ^ dataWordBits[dn - 4];
        // P2
        hammingCode[hn - 2] = dataWordBits[dn - 1] ^ dataWordBits[dn - 3] ^ dataWordBits[dn - 4];
        // P4
        hammingCode[hn - 4] = dataWordBits[dn - 2] ^ dataWordBits[dn - 3] ^ dataWordBits[dn - 4];
        hammingCode[hn - 3] = dataWordBits[dn - 1]; // D1
        hammingCode[hn - 5] = dataWordBits[dn - 2]; // D2
        hammingCode[hn - 6] = dataWordBits[dn - 3]; // D3
        hammingCode[hn - 7] = dataWordBits[dn - 4]; // D4

        const codeWord = hammingCode.join('');
        return codeWord;
    }

    dataWords.forEach(dataWord => {
        const frame = {
            sourceMac: dataFrame.sourceMACAddress,
            destinationMac: dataFrame.destinationMACAddress,
            EtherType: "IPv4",
            codeWord: getCodeWord(dataWord),
        }
        {
            status = `---------------` + `Data Link Layer` + `---------------\n`;
            statusTracker.push(status);
            status = `Generating Frame....\nDataword: ${dataWord} `;
            statusTracker.push(status);
            status =
                `- Source MAC: ${frame.sourceMac}\n` +
                `- Destination MAC: ${frame.destinationMac}\n` +
                `- EtherType: ${frame.EtherType}\n` +
                `- CodeWord: ${frame.codeWord}\n`;
            statusTracker.push(status);
        }
        physicalLayer(frame);

        {
            status = `\n\t>>>> Received Payload: ${payloadReceived}\n`;
            statusTracker.push(status);
            // status = `\n\t>>>> Sent     Payload: ${dataPacket.payload}\n`;
            // statusTracker.push(status);
        }
    });
}

function physicalLayer(frame) {
    {
        status = `Sending Frame...`;
        statusTracker.push(status);
        status = `---------------` + `Physical Layer` + `---------------`;
        statusTracker.push(status);
    }
    sourceNode.nodeBuffer = {
        frame: frame,
    }

    const destinationNode = sendFrame(frame)

    if (destinationNode) {
        receiveFrame(destinationNode.nodeBuffer);
    } else {
        console.log("Destination node not found");
    }
}

dataLinkLayer(dataPacket)



// ------------------------------------------------------------------




let index = 0;
function printStatus() {
    if (index < statusTracker.length) {
        console.log(statusTracker[index]);
        index++;
    } else {
        clearInterval(intervalId);
    }
}


const intervalId = setInterval(printStatus, 1000);

