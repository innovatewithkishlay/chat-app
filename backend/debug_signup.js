import axios from "axios";

const BASE_URL = "http://localhost:5100/api";

async function debug() {
    try {
        const username = `debug_user_${Math.floor(Math.random() * 10000)}`;
        console.log(`Attempting signup for ${username}...`);

        const res = await axios.post(`${BASE_URL}/auth/signup`, {
            fullname: username,
            email: `${username}@gmail.com`,
            password: "password123",
            username: username
        });

        console.log("Signup Success:", res.data);
    } catch (error) {
        console.error("Signup Failed Status:", error.response?.status);
        console.error("Signup Failed Data:", JSON.stringify(error.response?.data, null, 2));
        console.error("Signup Failed Message:", error.message);
    }
}

debug();
