const { ip, port } = require('./config.json');
const logger = require('./logger.js');
const { Yeelight } = require('yeelight-node')
const device = new Yeelight({ ip: ip, port: port })

const updateStep = 12500; // Delay between each step in milliseconds

const nightBrightness = 25; // Range 1 - 100
const dayBrightness = 100;

const nightTemp = 2500; // Range 1700 - 6500
const dayTemp = 5500;

const dayBegin = (7 * 60) + (0); // Hours / Minutes
const dayEnd = (8 * 60) + (30);

const nightBegin = (20 * 60) + (0);
const nightEnd = (22 * 60) + (0);

logger.info("Yeelight started on " + ip + ":" + port);
// device.on('connected', () => { logger.info("Connected!"); });
device.on('data', (newProps) => {});
device.on('close', () => { logger.warn("Connection closed"); });
device.on('error', (error) => { logger.error("Error: " + error); });

function correlate(val, minOld, maxOld, minNew, maxNew) {
        return Math.floor((((val - minOld) * (minNew - maxNew)) / (maxOld - minOld)) + maxNew);
}

function calculateValues() {
        // Get current date
        const nowDate = new Date();
        // Convert date into minutes
        const minutes = (nowDate.getHours() * 60) + nowDate.getMinutes();

        // Night to day transition range
        if (minutes > dayBegin && minutes <= dayEnd) {
                const temp = correlate(minutes, dayBegin, dayEnd, dayTemp, nightTemp);
                const brightness = correlate(minutes, dayBegin, dayEnd, dayBrightness, nightBrightness);
                return [temp, brightness];
        }
        // Day range
        else if (minutes > dayEnd && minutes <= nightBegin) {
                return [dayTemp, dayBrightness];
        }
        // Day to night transition range
        else if (minutes > nightBegin && minutes <= nightEnd) {
                const temp = correlate(minutes, nightEnd, nightBegin, dayTemp, nightTemp);
                const brightness = correlate(minutes, nightEnd, nightBegin, dayBrightness, nightBrightness);
                return [temp, brightness];
        }
        // Night range
        else {
                return [nightTemp, nightBrightness];
        }
}

// var fixedMinutes = 480;
let step = 10; // 10 so the logs are printed on first run
function update() {

        /*let hours = Math.floor(fixedMinutes / 60);
        let minutes = fixedMinutes % 60;

        if (hours < 10) hours = "0" + hours;
        if (minutes < 10) minutes = "0" + minutes;

        logger.info(hours + ":" + minutes + " " + calculateValues(fixedMinutes));
        fixedMinutes += 15;*/

        const values = calculateValues();
        const temperature = values[0];
        const brightness = values[1];

        // Print 1/10 step to not flood the logs with useless stuff
        if (step >= 10) { logger.info("Light temperature: " + temperature); logger.info("Light brightness: " + brightness); step = 0; }
        step++;

        device.set_ct_abx(temperature, 'smooth', 300); // Range: 1700 - 6500
        device.set_bright(brightness, 'smooth', 300); // Range: 1700 - 6500
}

update();
setInterval(update, updateStep);