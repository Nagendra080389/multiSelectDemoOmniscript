/**
 * Created by nagendrakumar.singh on 30/08/23.
 */

import OmniscriptTypeahead from "omnistudio/omniscriptTypeahead";
import tmpl from "./customTypeAheadWithPill.html";
import {dispatchOmniEvent} from "omnistudio/omniscriptUtils";
import {track} from "lwc";

export default class CustomTypeAheadWithPill extends OmniscriptTypeahead {
    @track pillValues = [];

    render() {
        return tmpl;
    }


    /**
     * Overriding connected callback to create pills back if the related data is found in the customNodeName of the
     * omniscript
     */
    connectedCallback() {
        super.connectedCallback();

        // Initialize the data based on custom attributes from Component JSON.
        let customNodeName = this.jsonDef.propSetMap.customNodeName;

        // This code will load the data back to the component based on the data from database.
        if (
            customNodeName &&
            this.jsonData &&
            this.jsonData[customNodeName] &&
            this.jsonData[customNodeName].length > 0
        ) {
            this.pillValues = this.jsonData[customNodeName];
        }
    }

    //This clears the data from the typeahead input element.
    handleCustomClear(event) {
        event.stopPropagation();
        event.preventDefault();
        this.elementValue = "";
    }

    // This gets called when we select a value from dropdown via enter or click.
    handleSelect(event) {
        super.handleSelect(event);
        if (event.detail && event.detail.item && event.detail.item.name) {
            const newValue = {
                label: event.detail.item.name,
                value: event.detail.item.value,
                selected: true
            };

            // Check if value is already in the array
            const existingValueIndex = this.pillValues.findIndex(
                (item) => item.value === newValue.value
            );

            // As pillValues are treated as read only variables, so cannot be changed directly, thus deep cloning it
            let copyPillValues = JSON.parse(JSON.stringify(this.pillValues));

            if (existingValueIndex === -1) {
                //value does not exist in the array, push the new value
                copyPillValues.push(newValue);
            } else {
                //remove the existing value from its current position
                copyPillValues.splice(existingValueIndex, 1);

                //Push the updated value to end of the array
                copyPillValues.push(newValue);
            }

            // Assing copyPillValues values back to pillValues;
            this.pillValues = copyPillValues;
        }
        this.updateDataInParentJSON();
        this.elementValue = "";
    }

    handleRemove(event) {
        let removedName = event.target.name;

        // Filter out the object with the specified value from this.pillValues
        this.makeNodeFalseBasedOnValue(this.pillValues, removedName);

        this.updateDataInParentJSON();
    }


    /**
     * Makes value as false based on removed node
     * @param pillValues Pill values to build the pill.
     * @param targetValue Target value which got removed.
     */
    makeNodeFalseBasedOnValue(pillValues, targetValue) {

        // As pillValues are treated as read only variables, so cannot be changed directly, thus deep cloning it
        let copyOforiginalArray = JSON.parse(JSON.stringify(pillValues));
        for (let eachArrayObject of copyOforiginalArray) {
            if (eachArrayObject.value === targetValue) {
                eachArrayObject.selected = false;
                break;
            }
        }

        // Assigning back the values to pillValues
        this.pillValues = copyOforiginalArray;
    }


    /**
     * This updates teh data in Parent omniscript JSON.
     * This is an internal method from Omniscript and the data has to be passed in the same way.
     */
    updateDataInParentJSON() {
        let customNodeName = this.jsonDef.propSetMap.customNodeName;
        let finalValue = [];
        for (let i = 0; i < this.pillValues.length; i++) {
            finalValue.push({
                label: this.pillValues[i].label,
                value: this.pillValues[i].value,
                selected: this.pillValues[i].selected
            });
        }

        let apiResponseData = {
            [customNodeName]: finalValue
        };
        let myData = {
            apiResponse: apiResponseData
        };

        //Fire event for updating parent omniscript json
        dispatchOmniEvent(this, myData, "omniactionbtn");
    }
}