/**
 * Top5ListController.js
 * 
 * This file provides responses for all user interface interactions.
 * 
 * @author McKilla Gorilla
 * @author ?
 */
export default class Top5Controller {
    constructor() {

    }

    setModel(initModel) {
        this.model = initModel;
        this.initHandlers();
    }

    initHandlers() {
        // SETUP THE TOOLBAR BUTTON HANDLERS
        document.getElementById("add-list-button").onmousedown = (event) => {
            if (this.model.currentList==null) {
                let newList = this.model.addNewList("Untitled", ["?","?","?","?","?"]);            
                this.model.loadList(newList.id);
                
                this.model.saveLists();
                this.model.statusbarUpdate();
            }
            
            
        }
        document.getElementById("undo-button").onmousedown = (event) => {
            this.model.undo();
        }

        document.getElementById("redo-button").onmousedown = (event) => {
            this.model.redo();
        }

        document.getElementById("close-button").onmousedown = (event) => {
            //this.model.close();
            this.model.currentList=null;
            this.model.unselectAll();
            this.model.view.clearWorkspace();
            this.model.tps.clearAllTransactions();
            this.model.view.updateToolbarButtons(this.model);
        }

        

        // SETUP THE ITEM HANDLERS
        for (let i = 1; i <= 5; i++) {
            let item = document.getElementById("item-" + i);

            // AND FOR TEXT EDITING
            item.ondblclick = (ev) => {
                if (this.model.hasCurrentList()) {
                    // CLEAR THE TEXT
                    item.innerHTML = ""; // text element set to null when double click

                    // ADD A TEXT FIELD
                    let textInput = document.createElement("input");
                    textInput.setAttribute("type", "text");
                    textInput.setAttribute("id", "item-text-input-" + i);
                    textInput.setAttribute("value", this.model.currentList.getItemAt(i-1));
                
                    item.appendChild(textInput);
                    textInput.focus();
                    textInput.ondblclick = (event) => {
                        this.ignoreParentClick(event);
                    }
                    textInput.onkeydown = (event) => {
                        if (event.key === 'Enter') {
                            this.model.addChangeItemTransaction(i-1, event.target.value);
                        }
                    }
                    textInput.onblur = (event) => {
                        this.model.addChangeItemTransaction(i-1, event.target.value);
                    }
                }
            }
            item.draggable=true;
            item.ondragstart = (event) => {
                event.dataTransfer.setData("text",event.target.id); 
            }

            item.ondragover = (ev) => {
                ev.preventDefault();
            }
            item.ondrop = (ev) => {
                ev.preventDefault();
                let targetid = ev.target.id.slice(-1) -1 ; //id of item that's being dropped on. 
                let data = ev.dataTransfer.getData("text").slice(-1) - 1; //ID of item being dragged
                this.model.addMoveItemTransaction(data,targetid);
            }




        }

    }

    registerListSelectHandlers(id) { //id from top5view when lists are made
        // FOR SELECTING THE LIST
        let selList = document.getElementById("top5-list-" + id); //the list card itself
        selList.onmousedown = (event) => {

            this.model.unselectAll();

            // GET THE SELECTED LIST

            this.model.loadList(id);
            this.model.statusbarUpdate();
            
        }
        selList.onmouseover = (event) => {
            this.model.mouseOverHighlight(id);
        }
        selList.onmouseout = (event) => {
            this.model.mouseOverUnhighlight(id);
        }

        //let listName = document.getElementById("list-card-text-" + id); //text of the list Name
        selList.ondblclick = (event) => {
            if (this.model.hasCurrentList()) {
                // CLEAR THE TEXT
                selList.innerHTML = ""; // text element set to null when double click
                
                // ADD A TEXT FIELD
                let textInput = document.createElement("input");
                textInput.setAttribute("type", "text");
                textInput.setAttribute("id", "item-text-input-" + id);
                textInput.setAttribute("value", this.model.currentList.getName());
                selList.appendChild(textInput);
                textInput.focus();


                textInput.ondblclick = (event) => {
                    this.ignoreParentClick(event);
                }
                textInput.onkeydown = (event) => {
                    if (event.key === 'Enter') {
                        this.model.changeListName(id,event.target.value);
                    }
                }
                //when user clicks away from textbox
                textInput.onblur = (event) => {
                    //this.model.restoreList();
                    this.model.changeListName(id,event.target.value);
                }
            }


            
        }
        


        // FOR DELETING THE LIST
        document.getElementById("delete-list-" + id).onmousedown = (event) => {
            this.ignoreParentClick(event); //prevents the list from actually being selected when you press the x button
            // VERIFY THAT THE USER REALLY WANTS TO DELETE THE LIST
            let modal = document.getElementById("delete-modal");
            this.listToDeleteIndex = this.model.getListIndex(id); //index of list to delete
            let listName = this.model.getList(this.listToDeleteIndex).getName();
            let deleteSpan = document.getElementById("delete-list-span");
            deleteSpan.innerHTML = "";
            deleteSpan.appendChild(document.createTextNode(listName));
            modal.classList.add("is-visible");
            
        }

        document.getElementById("dialog-cancel-button").onclick = (event) => {
            let modal = document.getElementById("delete-modal");
            modal.classList.remove("is-visible");
        };

        document.getElementById("dialog-confirm-button").onclick = (event) => {
            this.model.deleteList(this.listToDeleteIndex); //delete the list at that index
            let modal = document.getElementById("delete-modal");
            modal.classList.remove("is-visible");
        };


    }

    ignoreParentClick(event) {
        event.cancelBubble = true;
        if (event.stopPropagation) event.stopPropagation();
    }
}