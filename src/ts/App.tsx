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

import {
  aliasOf,
  property,
  subclass,
} from "esri/core/accessorSupport/decorators";

import Graphic from "esri/Graphic";
import GraphicsLayer from "esri/layers/GraphicsLayer";

import PlanningScene from "./PlanningScene";
import Timeline from "./Timeline";
import CreateArea from "./widget/CreateArea";
import CreateBuilding from "./widget/CreateBuilding";
import CreateWasteManagement from "./widget/CreateWasteManagement";
import CreateRenewableEnergy from "./widget/CreateRenewableEnergy";
import CreateHospitals from "./widget/CreateHospitals";
import CreateSchools from "./widget/CreateSchools";

import CreatePath from "./widget/CreatePath";
import DrawWidget from "./widget/DrawWidget";
import GlTFWidget from "./widget/GlTFWidget";
import SymbolGallery, { SymbolGroupId } from "./widget/SymbolGallery";
import WidgetBase from "./widget/WidgetBase";

import { tsx } from "esri/widgets/support/widget";

// Import OpenAI integration
import { getOpenAIPrediction } from "./openaiIntegration";
// Import the Chatbox component
import Chatbox from "./Chatbox";

import MaterialTracker from "./MaterialTracker";
import Point from "esri/geometry/Point";

// Add a state to hold chat messages
interface AppState {
  chatMessages: string[];
}

interface MainMenu {
  label: string;
  iconName: string;
  onClick: (element: HTMLElement) => void;
}

export interface Operation {
  cancel(): void;
}

export interface Settings {
  planningArea: number[][];
  planningAreaName: string;
  webSceneId: string;
}

const materialTypeConcrete = "Concrete";

@subclass("app.widgets.webmapview")
export default class App extends WidgetBase {
  @aliasOf("scene.map.portalItem.title")
  public title: string;

  @property()
  public thumbnailUrl: string;

  @property()
  public scene: PlanningScene;

  // Use @property() decorator for state
  @property()
  private chatMessages: string[] = [];

  public set currentOperation(operation: Operation | null) {
    if (this.operation) {
      this.operation.cancel();
    }
    this.operation = operation;
  }

  public get currentOperation(): Operation | null {
    return this.operation;
  }

  private timeline = new Timeline({ app: this });

  private createArea = new CreateArea({ app: this });

  private createPath = new CreatePath({ app: this });

  private createBuilding = new CreateBuilding({ app: this });

  private createWasteManagement = new CreateWasteManagement({ app: this });

  private createRenewableEnergy = new CreateRenewableEnergy({ app: this });

  private createHospitals = new CreateHospitals({ app: this });

  private createSchools = new CreateSchools({ app: this });

  private symbolGallery = new SymbolGallery({ app: this });

  private glTFWidget = new GlTFWidget({ app: this });

  @property()
  private selectedWidget: DrawWidget | null = null;

  private materialTracker: MaterialTracker = new MaterialTracker();

  private graphicsLayer: GraphicsLayer = new GraphicsLayer();

  private drawWidgets = [
    this.createArea,
    this.createPath,
    this.createBuilding,
    this.createWasteManagement,
    this.createRenewableEnergy,
    this.createHospitals,
    this.createSchools,
    this.symbolGallery,
    this.glTFWidget,
  ];

  private mainMenuEntries: MainMenu[] = [];

  private menuButtons: HTMLElement[] = [];

  private operation: Operation | null;

  // Example function to add a graphic to the GraphicsLayer
  private addGraphicToLayer(graphic: Graphic) {
    this.graphicsLayer.add(graphic);
  }

  public constructor(public settings: Settings) {
    super();
    this.scene = new PlanningScene(this);
    this.scene.map.add(this.graphicsLayer);
    this.state = { chatMessages: [] }; // Initialize the state
  }

  // Define a type for the state
  state: AppState = {
    chatMessages: [],
  };

  // Define the setState method
  setState(newState: Partial<AppState>) {
    this.state = { ...this.state, ...newState };
    this.scheduleRender();
  }

  // Function to get OpenAI prediction
  private async generateOpenAIPrediction(prompt: string) {
    try {
      console.log("Before OpenAI Prediction Request");
      const prediction = await getOpenAIPrediction(prompt);
      console.log("After OpenAI Prediction Request");

      if (prediction !== null) {
        // Update the chatMessages state with the new prediction
        this.setState({
          chatMessages: [...this.state.chatMessages, prediction],
        });

        // Example usage: create a concrete graphic and add it to the layer
        const concretePoint = new Point({
          x: -117.1956,
          y: 34.0566,
          spatialReference: { wkid: 4326 },
        });

        const concreteGraphic = new Graphic({
          geometry: concretePoint,
          attributes: {
            materialType: materialTypeConcrete,
            // Other attributes...
          },
          // Other graphic properties...
        });

        this.addGraphicToLayer(concreteGraphic);
      } else {
        console.error("OpenAI Prediction is null");
      }
    } catch (error) {
      console.error("Error generating OpenAI prediction:", error);
    }
  }

  public postInitialize() {
    const view = this.scene.view;
    view.on("click", (event) => {
      if (!this.currentOperation) {
        view.hitTest(event).then((response) => {
          // check user clicked on a graphic, in which case we try to pass it to a SketchViewModel
          response.results.some((result) => {
            const graphic = result.graphic;
            if (graphic && graphic.geometry) {
              return this.updateGraphic(graphic);
            }
            return false;
          });
        });
      }
      // Example usage of OpenAI integration
      const openAIPrompt = "Predict the future of city planning...";
      this.generateOpenAIPrediction(openAIPrompt);
    });

    this.mainMenuEntries.push({
      label: "Ground",
      iconName: "fas fa-layer-group",
      onClick: this.showWidget.bind(this, this.createArea),
    });
    this.mainMenuEntries.push({
      label: "Paths",
      iconName: "fas fa-road",
      onClick: this.showWidget.bind(this, this.createPath),
    });
    this.mainMenuEntries.push({
      label: "Buildings",
      iconName: "fas fa-building",
      onClick: this.showWidget.bind(this, this.createBuilding),
    });
    this.mainMenuEntries.push({
      label: "Hospitals",
      iconName: "fas fa-hospital",
      onClick: this.showWidget.bind(this, this.createHospitals),
    });
    this.mainMenuEntries.push({
      label: "Waste Management",
      iconName: "fas fa-recycle",
      onClick: this.showWidget.bind(this, this.createWasteManagement),
    });
    this.mainMenuEntries.push({
      label: "Renewable Energy",
      iconName: "fas fa-sun",
      onClick: this.showWidget.bind(this, this.createRenewableEnergy),
    });
    this.mainMenuEntries.push({
      label: "Schools",
      iconName: "fas fa-school",
      onClick: this.showWidget.bind(this, this.createSchools),
    });

    this.mainMenuEntries.push({
      label: "Icons",
      iconName: "fas fa-map-marker-alt",
      onClick: this.showSymbolGallery.bind(this, SymbolGroupId.Icons),
    });
    this.mainMenuEntries.push({
      label: "Trees",
      iconName: "fas fa-tree",
      onClick: this.showSymbolGallery.bind(this, SymbolGroupId.Trees),
    });
    this.mainMenuEntries.push({
      label: "Vehicles",
      iconName: "fas fa-car",
      onClick: this.showSymbolGallery.bind(this, SymbolGroupId.Vehicles),
    });
    this.mainMenuEntries.push({
      label: "glTF",
      iconName: "fas fa-cloud-download-alt",
      onClick: (element) => {
        this.glTFWidget.startImport();
        this.showWidget(this.glTFWidget, element);
      },
    });

    this.scene.map.when(() => {
      this.thumbnailUrl = this.scene.map.portalItem.getThumbnailUrl(400);
    });

    // Leave a reference of the view on the window for debugging
    (window as any).app = this;
  }

  public render() {
    const planningAreaName = this.settings.planningAreaName;

    const thumbnail = this.thumbnailUrl ? (
      <img
        class="card-wide-image"
        src={this.thumbnailUrl}
        alt={planningAreaName}
      />
    ) : null;

    // // Render the chatbox with OpenAI predictions
    // const chatbox = this.state.chatMessages.length > 0 && (
    //   <Chatbox messages={this.state.chatMessages} />
    // );
    // console.log("Chatbox:", chatbox);

    return (
      <div>
        <div id="scene" afterCreate={this.attachScene.bind(this)} />

        <div class="box">
          <div class="top">
            <div afterCreate={this.attachTimeline.bind(this)} />
          </div>
          <div class="content">
            <div
              class="hide"
              afterCreate={this.attachWidget.bind(this, this.createArea)}
            />
            <div
              class="hide"
              afterCreate={this.attachWidget.bind(this, this.createPath)}
            />
            <div
              class="hide"
              afterCreate={this.attachWidget.bind(this, this.createBuilding)}
            />
            <div
              class="hide"
              afterCreate={this.attachWidget.bind(
                this,
                this.createWasteManagement
              )}
            />
            <div
              class="hide"
              afterCreate={this.attachWidget.bind(
                this,
                this.createRenewableEnergy
              )}
            />
            <div
              class="hide"
              afterCreate={this.attachWidget.bind(this, this.createHospitals)}
            />
            <div
              class="hide"
              afterCreate={this.attachWidget.bind(this, this.createSchools)}
            />
            <div
              class="hide"
              afterCreate={this.attachWidget.bind(this, this.symbolGallery)}
            />
            <div
              class="hide"
              afterCreate={this.attachWidget.bind(this, this.glTFWidget)}
            />
          </div>
          <div class="menu-item"></div>
          <button
            class="btn"
            onclick={() => {
              console.log("Button Clicked");
              this.reset();
              this.generateOpenAIPrediction(
                "Predict the future of city planning..."
              );
            }}
          >
            <span class="fas fa-question" />
            <br />
            OpenAI Prediction
          </button>

          <div class="bottom">
            <div class="menu">
              <div class="menu-item">
                <button
                  class="btn btn-large"
                  onclick={() => {
                    this.reset();
                    this.timeline.showIntro();
                  }}
                >
                  NEW PLAN
                </button>
              </div>
              {this.mainMenuEntries.map((entry) => (
                <div class="menu-item">
                  <button
                    class="btn"
                    afterCreate={this.attachWidgetButton.bind(this, entry)}
                  >
                    <span class={"font-size-3 " + entry.iconName} />
                    <br />
                    {entry.label}
                  </button>
                </div>
              ))}
              <div class="menu-item">
                <button
                  class="btn btn-large"
                  onclick={() => {
                    this.reset();
                    this.timeline.takeScreenshot();
                  }}
                >
                  SUBMIT PLAN
                </button>
              </div>
            </div>
          </div>
        </div>

        <div id="overlay" class="center" />
        <div
          id="loadingIndicator"
          class="center hide"
          afterCreate={() => this.toggleLoadingIndicator(true)}
        >
          <div class="loader-bars"></div>
          <div class="loader-text text-white" id="loadingIndicatorText"></div>
        </div>

        <div id="intro" class="center">
          <div class="column-17">
            <div class="card card-wide">
              <figure class="card-wide-image-wrap phone-hide">
                {thumbnail}
                <div class="card-image-caption">{planningAreaName}</div>
              </figure>
              <div class="card-content">
                <h4 class="trailer-half">Smart City Planning</h4>
                <p class="font-size--1 trailer-half">
                  <ul>
                    <li>
                      When creating shapes, either double click or press{" "}
                      <code>C</code> to complete.
                    </li>
                    <li>
                      Press <code>Del</code> or <code>Backspace</code> to remove
                      a selected object.
                    </li>
                    <li>
                      Press <code>Escape</code> to revert a current editing.
                    </li>
                  </ul>
                </p>
                <div menu>
                  <button
                    class="menu-item btn"
                    onclick={() => this.timeline.playIntroAnimation()}
                  >
                    Start Planning
                  </button>
                  <button
                    class="menu-item btn btn-transparent"
                    onclick={() => this.timeline.startPlanning()}
                  >
                    Skip Animation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="screenshot" class="center hide">
          <div>
            <div class="center">
              <button
                class="btn btn-large btn-white"
                onclick={() => this.timeline.startPlanning()}
              >
                <span class="font-size-3 fas fa-arrow-left" />
                <br />
                Back
              </button>
            </div>
          </div>
          <div>
            <div class="center">
              <canvas id="screenshotCanvas" />
            </div>
          </div>
          <div>
            <div class="center">
              <button
                class="btn btn-large btn-white"
                onclick={() => this.timeline.downloadScreenshot()}
              >
                <span class="font-size-3 fas fa-share-square" />
                <br />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Method to toggle the chatbox visibility
  private toggleChatbox() {
    const chatbox = document.getElementById("chatbox");
    if (chatbox) {
      chatbox.classList.toggle("chatbox-visible");
    }
  }

  private attachScene(element: HTMLDivElement) {
    this.scene.container = element;
  }

  private attachTimeline(element: HTMLDivElement) {
    this.timeline.container = element;
  }

  private attachWidget(menu: DrawWidget, element: HTMLDivElement) {
    menu.container = element;
  }

  private attachWidgetButton(menu: MainMenu, element: HTMLDivElement) {
    this.menuButtons.push(element);
    element.onclick = () => {
      menu.onClick(element);
    };
  }

  private reset() {
    this.hideWidget();
    // Cancel any ongoing operation
    if (this.currentOperation) {
      this.currentOperation.cancel();
    }
  }

  private hideWidget() {
    this.menuButtons.forEach((button) => button.classList.remove("active"));
    if (this.selectedWidget && this.selectedWidget.container) {
      (this.selectedWidget.container as HTMLElement).classList.add("hide");
    }
  }

  private showWidget(widget: DrawWidget, element: HTMLElement) {
    this.menuButtons.forEach((button) => button.classList.remove("active"));
    if (this.selectedWidget) {
      this.hideWidget();
      if (this.selectedWidget === widget) {
        this.selectedWidget = null;
        return;
      }
    }
    this.selectedWidget = widget;

    // Add defensive checks to prevent accessing classList on null or undefined
    if (element && element.classList) {
      element.classList.add("active");
    }

    if (this.selectedWidget && this.selectedWidget.container) {
      const selectedWidgetContainer = this.selectedWidget
        .container as HTMLElement;
      if (selectedWidgetContainer && selectedWidgetContainer.classList) {
        selectedWidgetContainer.classList.remove("hide");
      }
    }
  }

  private showSymbolGallery(groupId: SymbolGroupId, element: HTMLElement) {
    this.menuButtons.forEach((button) => button.classList.remove("active"));
    if (this.symbolGallery.selectedGroupId !== groupId) {
      this.symbolGallery.selectedGroupId = groupId;
      if (this.selectedWidget === this.symbolGallery) {
        element.classList.add("active");
        return;
      }
    }
    this.showWidget(this.symbolGallery, element);
  }

  public updateGraphic(graphic: Graphic): boolean {
    if (graphic && graphic.layer) {
      const isUpdated = this.drawWidgets.some((widget) => {
        if (widget.layer === graphic.layer) {
          widget.updateGraphic(graphic);

          // Check if graphic has materialType property before tracking
          if (graphic.attributes && graphic.attributes.materialType) {
            this.materialTracker.trackMaterial(graphic);
          }

          return true;
        }
        return false;
      });

      return isUpdated;
    }

    return false;
  }
}
