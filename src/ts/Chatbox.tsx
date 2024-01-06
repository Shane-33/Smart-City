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

// Chatbox.tsx

import { tsx } from "esri/widgets/support/widget";
import React, { useState } from "react";
import "./Chatbox.css"; // Import the style

interface ChatboxProps {
  messages: string[];
}

const Chatbox: React.FC<ChatboxProps> = ({ messages }) => {
  // Example usage of useState
  const [inputValue, setInputValue] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`chatbox-container ${isOpen ? "open" : ""}`}>
      <div className="chatbox-header" onClick={() => setIsOpen(!isOpen)}>
        Chatbox
      </div>
      <div className="chatbox-content">
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Chatbox;
