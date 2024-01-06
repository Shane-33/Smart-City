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

// Define constants for RenewableEnergy
const RENEWABLE_ENERGY_COLOR = "#00FFFF"; // Cyan color for renewable energy
const RENEWABLE_ENERGY_FLOOR_HEIGHT = 3;

@subclass("app.draw.CreateRenewableEnergy")
export default class CreateRenewableEnergy extends DrawWidget {
  @property()
  private renewableEnergyCount: number;

  public render() {
    const inactive = "btn btn-large";
    const active = inactive + " active";

    return (
      <div>
        <div class="menu">
          {[10, 20, 30].map((count) => (
            <div class="menu-item" key={count}>
              <button
                class={count === this.renewableEnergyCount ? active : inactive}
                onclick={() => this.startDrawing(count)}
              >
                No.{count / 10}-Renewable Energy
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  public updateGraphic(graphic: Graphic): Promise<Graphic[]> {
    return this.updatePolygonGraphic(graphic, RENEWABLE_ENERGY_COLOR);
  }

  private startDrawing(count: number) {
    console.log(`Start drawing renewable energy with count: ${count}`);
    const extrusionSize = count * RENEWABLE_ENERGY_FLOOR_HEIGHT;

    const symbol = this.createRenewableEnergySymbol(extrusionSize);

    this.createAndAddPolygonGraphic(symbol)
      .finally(() => {
        this.renewableEnergyCount = 0;
      })
      .catch(() => {
        // Ignore
      });

    this.renewableEnergyCount = count;
  }

  private createRenewableEnergySymbol(extrusionSize: number): PolygonSymbol3D {
    return new PolygonSymbol3D({
      symbolLayers: [
        {
          type: "extrude",
          material: {
            color: RENEWABLE_ENERGY_COLOR,
          },
          edges: {
            type: "solid",
            color: [100, 100, 100],
          },
          size: extrusionSize,
        },
      ] as any,
    });
  }

  private createAndAddPolygonGraphic(symbol: PolygonSymbol3D): Promise<void> {
    return this.createPolygonGraphic(symbol, RENEWABLE_ENERGY_COLOR)
      .then(() => {
        // Add any additional handling here if needed
      })
      .catch((error) => {
        console.error(
          "Error creating and adding renewable energy graphic:",
          error
        );
        // Handle the error as needed
      });
  }
}
