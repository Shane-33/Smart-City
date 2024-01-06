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

// @ts-ignore
import anime from "animejs";
import Color from "esri/Color";
import { aliasOf, subclass } from "esri/core/accessorSupport/decorators";
import Collection from "esri/core/Collection";
import Polyline from "esri/geometry/Polyline";
import SpatialReference from "esri/geometry/SpatialReference";
import Graphic from "esri/Graphic";
import VectorTileLayer from "esri/layers/VectorTileLayer";
import Viewpoint from "esri/Viewpoint";
import Slide from "esri/webscene/Slide";
import { tsx } from "esri/widgets/support/widget";

import WidgetBase from "./widget/WidgetBase";

export const AREA_ANIMATION_DURATION = 2000;
export const MASK_ANIMATION_DURATION = 1000;

const maskPolygonSymbol = (color: Color): any => {
  return {
    type: "simple-fill",
    color,
    outline: {
      width: 0,
    },
  };
};

const EMPTY_POLYLINE = new Polyline({
  paths: [
    [
      [0, 0],
      [1, 1],
    ],
  ],
  spatialReference: SpatialReference.WebMercator,
});

@subclass("app.widgets.Timeline")
export default class Timeline extends WidgetBase {
  private vectorTileLayer = new VectorTileLayer({
    portalItem: {
      id: "5cf1abb43c25482e8a9e373953498999",
    },
    visible: false,
  } as any);

  private initialViewpoint: Viewpoint;

  @aliasOf("app.scene.map.presentation.slides")
  private slides: Collection<Slide>;

  private drawViewpoint: Viewpoint;

  private maskColor = new Color([226, 119, 40]);

  private maskPolyline = new Graphic({
    geometry: EMPTY_POLYLINE,
    symbol: {
      type: "line-3d",
      symbolLayers: [
        {
          type: "line",
          size: 6,
          material: { color: this.maskColor },
        },
      ],
    },
  } as any);

  private maskPolygon: Graphic;

  private showIntroDialog = true;

  public postInitialize() {
    const queryParams = document.location.search.substr(1);
    this.showIntroDialog = queryParams !== "skipTutorial";

    const scene = this.app.scene;
    const map = scene.map;
    map.when(() => {
      this.initialViewpoint = map.initialViewProperties.viewpoint;
      this.drawViewpoint = this.slides.length
        ? this.slides.getItemAt(0).viewpoint
        : this.initialViewpoint;

      map.layers.add(this.vectorTileLayer);

      const color = this.maskColor.clone();
      color.a = 0;
      this.maskPolygon = new Graphic({
        symbol: maskPolygonSymbol(color),
        geometry: scene.maskPolygon,
      } as any);

      scene.sketchLayer.add(this.maskPolyline);
      scene.sketchLayer.add(this.maskPolygon);

      map.ground.surfaceColor = new Color("#f0f0f0");
    });

    this.toggleElement("screenshot", false);
  }

  public render() {
    const slides = this.slides.toArray();

    return (
      <div class="timeline">
        {this.showIntroDialog ? (
          <div />
        ) : (
          <div class="menu menu-left phone-hide">
            <div class="menu-item">
              <button
                class="btn btn-large"
                onclick={this.playIntroAnimation.bind(this)}
              >
                Intro
              </button>
            </div>
          </div>
        )}
        <div class="menu phone-hide">
          {slides.map((slide) => (
            <div class="menu-item" key={slide.id}>
              <button
                class="btn btn-large"
                onclick={() => this.goTo(slide.viewpoint)}
              >
                {slide.title.text}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  public showIntro(): Promise<void> {
    this.toggleLoadingIndicator(true);
    this.app.scene.showMaskedBuildings("white");
    this.app.scene.clear();
    return this.goTo(this.initialViewpoint).then(() => {
      this.toggleBasemap(true);
      if (this.showIntroDialog) {
        this.toggleElement("intro", true);
      } else {
        this.toggleElement("intro", false);
        this.toggleLoadingIndicator(false);
      }
    });
  }

  public playIntroAnimation(): Promise<void> {
    this.toggleElement("intro", false);
    return this.app.scene
      .whenNotUpdating()
      .then(() => {
        this.toggleOverlay(false);
        this.toggleLoadingIndicator(false);
      })
      .then(() => this.goTo(this.maskPolygon, 1500))
      .then(() => this.animateArea())
      .then(() => this.animateMask())
      .then(() => this.goTo(this.drawViewpoint))
      .then(() => this.toggleBasemap(false));
  }

  public startPlanning() {
    this.toggleElement("intro", false);
    return this.app.scene.whenNotUpdating().then(() => {
      this.toggleOverlay(false);
      this.toggleLoadingIndicator(false);
      this.toggleElement("intro", false);
      this.toggleElement("screenshot", false);

      // Not strickly serial, simply to speed up scene getting ready to edit
      this.goTo(this.drawViewpoint);
      this.toggleBasemap(false);
      this.app.scene.showMaskedBuildings();
    });
  }

  public takeScreenshot() {
    const view = this.app.scene.view;
    const width = Math.min(
      this.app.scene.view.width,
      this.app.scene.view.height
    );
    const options = { format: "png" as "png", width: width * 0.8 };
    this.toggleLoadingIndicator(true, "Capturing Scene");

    setTimeout(() => {
      this.app.scene
        .whenNotUpdating()
        .then(() => view.takeScreenshot(options))
        .then((after) => {
          this.app.scene.showTexturedBuildings();
          this.toggleBasemap(true);
          setTimeout(() => {
            this.app.scene
              .whenNotUpdating()
              .then(() => view.takeScreenshot(options))
              .then((before) => {
                this.showScreenshot(before, after);

                this.app.scene.showMaskedBuildings();
                this.toggleBasemap(false);
              });
          }, 100);
        });
    }, 100);
  }

  public downloadScreenshot() {
    const filename = "ParticipatoryPlanning.png";
    const canvas = document.getElementById(
      "screenshotCanvas"
    ) as HTMLCanvasElement;
    const dataUrl = canvas.toDataURL("image/png");

    // Taken from https://developers.arcgis.com/javascript/latest/sample-code/sceneview-screenshot/index.html
    // the download is handled differently in Microsoft browsers
    // because the download attribute for <a> elements is not supported
    if (!(window.navigator as any).msSaveOrOpenBlob) {
      // Code for browsers that support the download attribute
      // a link is created and a programmatic click will trigger the download
      const element = document.createElement("a");
      element.setAttribute("href", dataUrl);
      element.setAttribute("download", filename);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      // for MS browsers convert dataUrl to Blob
      const byteString = atob(dataUrl.split(",")[1]);
      const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      // download file
      (window.navigator as any).msSaveOrOpenBlob(blob, filename);
    }
  }

  private showScreenshot(before: __esri.Screenshot, after: __esri.Screenshot) {
    const canvas = document.getElementById(
      "screenshotCanvas"
    ) as HTMLCanvasElement;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    const height =
      (canvas.width =
      canvas.height =
        Math.min(before.data.width, 2 * before.data.height));
    const x = -(before.data.width - height) / 2;
    const dirtyY = (before.data.height - height / 2) / 2;
    context.putImageData(
      before.data,
      x,
      -dirtyY,
      0,
      dirtyY,
      before.data.width,
      height / 2
    );
    context.putImageData(
      after.data,
      x,
      height / 2 - dirtyY,
      0,
      dirtyY,
      after.data.width,
      height / 2
    );

    context.font = "bold 50px Helvetica";
    context.fillStyle = "white";
    context.fillText("Now", 15, height / 2 - 22);
    context.fillText("My Plan", 15, height - 22);

    this.toggleLoadingIndicator(false);
    this.toggleOverlay(true, 0.9);
    this.toggleElement("screenshot", true);
  }

  private goTo(target: Viewpoint | Graphic, duration = 800): Promise<void> {
    const view = this.app.scene.view;
    return view
      .goTo(target, { duration })
      .then(() => {
        // Wait for all layers to update after applying a new slide
        return this.app.scene.whenNotUpdating();

        // Catching any exceptions in case animation gets canceled
      })
      .catch(console.log);
  }

  private animateArea(): Promise<void> {
    const planningArea = this.app.settings.planningArea;
    const start = planningArea[0];
    const waypoints = planningArea.slice(1);
    waypoints.push(start);

    const durations: number[] = [];
    let totalLength = 0;

    waypoints.forEach((point, index) => {
      const a = point[0] - planningArea[index][0];
      const b = point[1] - planningArea[index][1];
      const length = Math.sqrt(a * a + b * b); // Math.abs(a * b);
      durations.push(length);
      totalLength += length;
    });

    durations.forEach((duration, index) => {
      durations[index] = (duration * AREA_ANIMATION_DURATION) / totalLength;
    });

    const paths = [start];

    const movingPoint = {
      x: start[0],
      y: start[1],
    };

    let timeline = anime.timeline({
      update: () => {
        if (paths.length) {
          this.maskPolyline.geometry = {
            type: "polyline",
            paths: [paths.concat([[movingPoint.x, movingPoint.y]])],
            spatialReference: SpatialReference.WebMercator,
          } as any;
        }
      },
    });
    waypoints.forEach((point, index) => {
      timeline = timeline.add({
        targets: movingPoint,
        x: point[0],
        y: point[1],
        duration: durations[index],
        easing: "easeInOutCubic",
        complete: () => {
          paths.push([movingPoint.x, movingPoint.y]);
        },
      });
    });
    return timeline.finished;
  }

  private animateMask(): Promise<void> {
    const color = new Color({
      r: 226,
      g: 119,
      b: 40,
      a: 0,
    });

    const buildingColor = new Color({
      r: 256,
      g: 256,
      b: 256,
    });

    const timeline = anime
      .timeline({
        update: () => {
          this.maskPolygon.symbol = maskPolygonSymbol(color);
          this.app.scene.showMaskedBuildings(buildingColor);
        },
      })
      .add({
        targets: [color, buildingColor],
        r: 226,
        g: 119,
        b: 40,
        a: 0.6,
        duration: MASK_ANIMATION_DURATION / 2,
        easing: "easeInOutCubic",
      })
      .add({
        targets: [color, buildingColor],
        a: 0,
        delay: 100,
        duration: MASK_ANIMATION_DURATION / 2,
        endDelay: 1500,
        easing: "easeInOutCubic",
        complete: () => {
          this.maskPolyline.geometry = EMPTY_POLYLINE;
        },
      });
    return timeline.finished;
  }

  private toggleBasemap(show: boolean): Promise<void> {
    this.app.scene.map.basemap = (show ? "satellite" : null) as any;
    this.vectorTileLayer.visible = !show;
    return this.app.scene.whenNotUpdating();
  }
}
