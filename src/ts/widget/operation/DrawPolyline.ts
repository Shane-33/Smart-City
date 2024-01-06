/*
 * Copyright 2019 Esri
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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

import Color from "esri/Color";
import Polyline from "esri/geometry/Polyline";
import Graphic from "esri/Graphic";
import SketchViewModel from "esri/widgets/Sketch/SketchViewModel";

import DrawWidget from "../DrawWidget";
import DrawGeometry from "./DrawGeometry";

export default class DrawPolyline extends DrawGeometry<Polyline> {
  constructor(
    widget: DrawWidget,
    graphic: Graphic,
    protected sketchColor: string
  ) {
    super(widget, graphic, "polyline");
  }

  protected createSketchViewModel(): SketchViewModel {
    const sketchViewModel = super.createSketchViewModel();

    const color = new Color(this.sketchColor);
    color.a = 0.5;

    sketchViewModel.polylineSymbol.color = color;

    sketchViewModel.pointSymbol.color = color;
    sketchViewModel.pointSymbol.outline.width = 0;

    return sketchViewModel;
  }

  protected createSketch(sketchViewModel: SketchViewModel): Graphic {
    const sketchGraphic = this.graphic.clone();
    sketchGraphic.symbol = sketchViewModel.polylineSymbol;
    return sketchGraphic;
  }

  protected geometryFromSketch(sketchGraphic: Graphic): Polyline | null {
    let polyline = super.geometryFromSketch(sketchGraphic);
    polyline = polyline ? this.clippedGeometry(polyline) : null;
    return polyline;

    // Trying to be smart to snap lines back onto the masking polygon
    // polyline.paths.forEach((path) => this.snapVertices(path));
    // if (polyline.paths.length && 2 <= polyline.paths[0].length) {
    //   const path = polyline.paths.reduce((total, segment) => total.concat(segment));
    //   polyline = new Polyline({
    //     paths: [path],
    //     spatialReference: this.scene.view.spatialReference,
    //   });
    // }
  }
}
