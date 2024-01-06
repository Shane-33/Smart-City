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

// Import necessary modules
import Graphic from "esri/Graphic";
import PolygonSymbol3D from "esri/symbols/PolygonSymbol3D";
import { property, subclass } from "esri/core/accessorSupport/decorators";
import DrawWidget from "./DrawWidget";
import { tsx } from "esri/widgets/support/widget";

// Define constants for WasteManagement
const WASTE_MANAGEMENT_COLOR = "#00FF00"; // Green color for waste management
const WASTE_MANAGEMENT_FLOOR_HEIGHT = 3;

@subclass("app.draw.CreateWasteManagement")
export default class CreateWasteManagement extends DrawWidget {
  @property()
  private wasteManagementCount: number;

  public render() {
    const inactive = "btn btn-large";
    const active = inactive + " active";

    return (
      <div>
        <div class="menu">
          {[10, 20, 30].map((count) => (
            <div class="menu-item" key={count}>
              <button
                class={count === this.wasteManagementCount ? active : inactive}
                onclick={() => this.startDrawing(count)}
              >
                No.{count / 10}-Waste Management
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  public updateGraphic(graphic: Graphic): Promise<Graphic[]> {
    return this.updatePolygonGraphic(graphic, WASTE_MANAGEMENT_COLOR);
  }

  private startDrawing(count: number) {
    console.log(`Start drawing waste management with count: ${count}`);
    const extrusionSize = count * WASTE_MANAGEMENT_FLOOR_HEIGHT;

    const symbol = this.createWasteManagementSymbol(extrusionSize);

    this.createAndAddPolygonGraphic(symbol)
      .finally(() => {
        this.wasteManagementCount = 0;
      })
      .catch(() => {
        // Ignore
      });

    this.wasteManagementCount = count;
  }

  private createWasteManagementSymbol(extrusionSize: number): PolygonSymbol3D {
    return new PolygonSymbol3D({
      symbolLayers: [
        {
          type: "extrude",
          material: {
            color: WASTE_MANAGEMENT_COLOR,
          },
          edges: {
            type: "solid",
            color: [0, 128, 128],
          },
          size: extrusionSize,
        },
      ] as any,
    });
  }

  private createAndAddPolygonGraphic(symbol: PolygonSymbol3D): Promise<void> {
    return this.createPolygonGraphic(symbol, WASTE_MANAGEMENT_COLOR)
      .then(() => {
        // Add any additional handling here if needed
      })
      .catch((error) => {
        console.error(
          "Error creating and adding waste management graphic:",
          error
        );
        // Handle the error as needed
      });
  }
}
