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

// MaterialTracker.ts

import Graphic from "esri/Graphic";
import GraphicsLayer from "esri/layers/GraphicsLayer";

export default class MaterialTracker {
  private materials: Map<string, number> = new Map(); // Example: Map<MaterialType, Quantity>

  public trackMaterial(graphic: Graphic) {
    // Your logic to extract material information from the graphic
    const materialType = graphic.attributes["materialType"] as string;

    if (materialType) {
      const currentQuantity = this.materials.get(materialType) || 0;
      this.materials.set(materialType, currentQuantity + 1);
    }
  }

  public getMaterialQuantities(): Map<string, number> {
    return new Map(this.materials);
  }
}
