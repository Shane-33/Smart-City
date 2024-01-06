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
import PolygonSymbol3D from "esri/symbols/PolygonSymbol3D";
import { tsx } from "esri/widgets/support/widget";

import DrawWidget from "./DrawWidget";

const SCHOOL_COLOR = "#A52A2A"; // brown color for schools
const SCHOOL_FLOOR_HEIGHT = 3;

@subclass("app.draw.CreateSchools")
export default class CreateSchools extends DrawWidget {
  @property()
  private classrooms: number;

  public postInitialize() {
    this.layer.elevationInfo = {
      mode: "on-the-ground",
    };
  }

  public render() {
    const inactive = "btn btn-large";
    const active = inactive + " active";

    return (
      <div>
        <div class="menu">
          {[20, 25, 30].map((classrooms) => (
            <div class="menu-item" key={classrooms}>
              <button
                class={classrooms === this.classrooms ? active : inactive}
                onclick={() => this.startDrawing(classrooms)}
              >
                {classrooms * 10} Classroom(s)
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  public updateGraphic(graphic: Graphic): Promise<Graphic[]> {
    return this.updatePolygonGraphic(graphic, SCHOOL_COLOR);
  }

  private startDrawing(classrooms: number) {
    console.log(`Start drawing schools with ${classrooms} classrooms`);
    const extrusionSize = classrooms * SCHOOL_FLOOR_HEIGHT;

    const symbol = this.createSchoolSymbol(extrusionSize);

    this.createAndAddPolygonGraphic(symbol)
      .finally(() => {
        this.classrooms = 0;
      })
      .catch(() => {
        // Ignore
      });

    this.classrooms = classrooms;
  }

  private createSchoolSymbol(extrusionSize: number): PolygonSymbol3D {
    return new PolygonSymbol3D({
      symbolLayers: [
        {
          type: "extrude",
          material: {
            color: SCHOOL_COLOR,
          },
          edges: {
            type: "solid",
            color: [165, 42, 42],
          },
          size: extrusionSize,
        },
      ] as any,
    });
  }

  private createAndAddPolygonGraphic(symbol: PolygonSymbol3D): Promise<void> {
    return this.createPolygonGraphic(symbol, SCHOOL_COLOR)
      .then(() => {
        // Add any additional handling here if needed
      })
      .catch((error) => {
        console.error("Error creating and adding school graphic:", error);
        // Handle the error as needed
      });
  }
}
