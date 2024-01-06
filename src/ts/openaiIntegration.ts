/*
 * © 2024 Shane. All rights reserved.
 *
 * This software is licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import axios, { AxiosError } from "axios";

// Set your OpenAI API key
const OPENAI_API_KEY =
  "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".trim();

// OpenAI API endpoint for GPT-3 completions
const OPENAI_API_ENDPOINT =
  "https://api.openai.com/v1/engines/davinci/completions";

// Function to interact with the OpenAI API
export async function getOpenAIPrediction(
  prompt: string,
  retriesLeft = 5
): Promise<string | null> {
  try {
    console.log("Before OpenAI Prediction Request");

    const response = await axios.post(
      OPENAI_API_ENDPOINT,
      {
        prompt: prompt,
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("After OpenAI Prediction Request");
    console.log("OpenAI Prediction Response:", response.data);

    // Extract and return the generated text
    return response.data.choices[0]?.text || null;
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response &&
      error.response.status === 429
    ) {
      // Retry with increased wait time
      if (retriesLeft > 0) {
        const delay = Math.pow(2, 6 - retriesLeft) * 1000; // Increase the power factor
        console.log(`Rate limited. Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return getOpenAIPrediction(prompt, retriesLeft - 1);
      }
    }

    handleOpenAIError(error);
    return null;
  }
}

function handleOpenAIError(error: any): void {
  if (axios.isAxiosError(error)) {
    const axiosError: AxiosError = error;

    if (axiosError.response) {
      // The request was made and the server responded with a status code
      console.error(
        "OpenAI API Error Response:",
        axiosError.response.status,
        axiosError.response.data
      );
    } else if (axiosError.request) {
      // The request was made but no response was received
      console.error("OpenAI API No Response:", axiosError.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("OpenAI API Request Setup Error:", axiosError.message);
    }
  } else {
    // Handle non-Axios errors
    console.error("Unknown OpenAI API Error:", error);
  }
}
