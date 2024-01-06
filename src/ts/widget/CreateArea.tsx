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

import { property, subclass } from "esri/core/accessorSupport/decorators";
import Graphic from "esri/Graphic";
import SimpleFillSymbol from "esri/symbols/SimpleFillSymbol";
import Color from "esri/Color";
import { tsx } from "esri/widgets/support/widget";
import DrawWidget from "./DrawWidget";

interface ColorMenu {
  label: string;
  color: string;
}

@subclass("app.draw.CreateArea")
export default class CreateArea extends DrawWidget {
  @property()
  private activeColor: string | null = null;

  private colorMenus: ColorMenu[] = [
    {
      label: "Ground",
      color: "#f0f0f0",
    },
    {
      label: "Lawn",
      color: "#bdce8a",
    },
    {
      label: "Beach",
      color: "#dfca8f",
    },
    {
      label: "Stone/Pavement",
      color: "#a0a0a0",
    },
    {
      label: "Snow/Ice",
      color: "#ffffff",
    },
    {
      label: "Park/Recreation Area",
      color: "#8fd17e",
    },
    {
      label: "Industrial Area",
      color: "#7c7c7c",
    },
    {
      label: "Wetland/Marsh",
      color: "#78a58b",
    },
  ];

  public postInitialize() {
    this.layer.elevationInfo = {
      mode: "on-the-ground",
    };
  }

  private getButtonClass(color: string): string {
    return color === this.activeColor
      ? "btn btn-large active"
      : "btn btn-large";
  }

  public render() {
    return (
      <div>
        <div class="menu">
          {this.colorMenus.map((menu) => (
            <div class="menu-item">
              <button
                class={this.getButtonClass(menu.color)}
                onclick={() => this.startDrawing(menu.color)}
              >
                Create {menu.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  public updateGraphic(graphic: Graphic): Promise<Graphic[]> {
    return this.updatePolygonGraphic(
      graphic,
      (graphic.symbol.color as Color).toHex()
    );
  }

  private startDrawing(color: string) {
    const symbol = new SimpleFillSymbol({
      color,
      outline: {
        width: 0,
      },
    });

    // Catch and ignore errors during graphic creation
    this.createPolygonGraphic(symbol, color)
      .finally(() => {
        this.activeColor = null;
      })
      .catch(() => {
        // Log or handle the error appropriately
        console.error("Error during graphic creation");
      });

    this.activeColor = color;
  }
}
