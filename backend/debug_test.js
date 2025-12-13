import axios from "axios";

const BASE_URL = "http://localhost:5100/api";

async function test() {
    try {
        console.log("Checking test route...");
        const res = await axios.get(`${BASE_URL}/test`);
        console.log("Test Route Status:", res.status);
        console.log("Test Route Data:", res.data);
    } catch (error) {
        console.log("Test Route Failed Status:", error.response?.status);
        console.log("Test Route Failed Message:", error.message);
    }
}

test();
