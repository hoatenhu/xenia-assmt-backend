const axios = require("axios");
const FormData = require("form-data");

const baseUrl = 'https://xenia-assmt-backend.onrender.com';
// const baseUrl = "http://localhost:3001";

describe("Server API Tests", () => {
  test("GET /data should return status 200 and an array", async () => {
    const response = await axios.get(`${baseUrl}/data`);

    expect(response.status).toBe(200);

    expect(Array.isArray(response.data)).toBe(true);
  });

  test("POST /data should upload a file and return status 201", async () => {
    const formData = new FormData();

    formData.append("name", "Nhu Hoa");
    formData.append("email", "nhuhoa@gmail.com");

    const fileContent = Buffer.from("fake content", "utf-8");

    formData.append("avatar", fileContent, { filename: "fake_avatar.png" });

    const response = await axios.post(`${baseUrl}/data`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    expect(response.status).toBe(201);
  });

  test("DELETE /data/:id should delete an item and return status 200", async () => {
    try {
      const existingItem = {
        id: 1,
        name: "Nhu Hoa",
        email: "nhuhoa@gmail.com",
        avatar: "path/to/avatar.png",
      };

      const deleteResponse = await axios.delete(
        `${baseUrl}/data/${existingItem.id}`
      );

      expect(deleteResponse.status).toBe(200);
    } catch (error) {
      console.error("Error in delete test:", error);

      throw error;
    }
  });
});
