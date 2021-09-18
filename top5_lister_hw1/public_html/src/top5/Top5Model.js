import jsTPS from "../common/jsTPS.js"
import Top5List from "./Top5List.js";
import ChangeItem_Transaction from "./transactions/ChangeItem_Transaction.js"
import MoveItem_Transaction from "./transactions/MoveItem_Transaction.js"

/**
 * Top5Model.js
 * 
 * This class provides access to all the data, meaning all of the lists. 
 * 
 * This class provides methods for changing data as well as access
 * to all the lists data.
 * 
 * Note that we are employing a Model-View-Controller (MVC) design strategy
 * here so that when data in this class changes it is immediately reflected
 * inside the view of the page.
 * 
 * @author McKilla Gorilla
 * @author ?
 */
export default class Top5Model {
    constructor() {
        // THIS WILL STORE ALL OF OUR LISTS
        this.top5Lists = [];

        // THIS IS THE LIST CURRENTLY BEING EDITED
        this.currentList = null;

        // THIS WILL MANAGE OUR TRANSACTIONS
        this.tps = new jsTPS();

        // WE'LL USE THIS TO ASSIGN ID NUMBERS TO EVERY LIST
        this.nextListId = 0;
    }

    getList(index) {
        return this.top5Lists[index];
    }

    getListIndex(id) {
        for (let i = 0; i < this.top5Lists.length; i++) {
            let list = this.top5Lists[i];
            if (list.id === id) {
                return i;
            }
        }
        return -1;
    }

    setView(initView) {
        this.view = initView;
    }

    addNewList(initName, initItems) {
        let newList = new Top5List(this.nextListId++);
        if (initName)
            newList.setName(initName);
        if (initItems)
            newList.setItems(initItems);
        this.top5Lists.push(newList);
        this.sortLists();
        this.view.refreshLists(this.top5Lists);
        return newList;
    }

    sortLists() {
        this.top5Lists.sort((listA, listB) => {
            if (listA.getName() < listB.getName()) {
                return -1;
            }
            else if (listA.getName === listB.getName()) {
                return 0;
            }
            else {
                return 1;
            }
        });
        this.view.refreshLists(this.top5Lists);
    }

    hasCurrentList() {
        return this.currentList !== null;
    }

    unselectAll() {
        for (let i = 0; i < this.top5Lists.length; i++) {
            let list = this.top5Lists[i];
            this.view.unhighlightList(list.id);
        }
    }

    loadList(id) {
        let list = null;
        let found = false;
        let i = 0;
        let prevId;
        if (this.hasCurrentList()) {
            prevId=this.currentList.id; //previous list id set to the currentlist id
        }
        while ((i < this.top5Lists.length) && !found) {
            list = this.top5Lists[i];
            if (list.id === id) {
                // THIS IS THE LIST TO LOAD
                this.currentList = list;
                this.view.update(this.currentList);
                this.view.highlightList(list.id);
                found = true;
            }
            i++;
        }
        if (prevId==null || prevId!==id) { //if there was no currentlist or the list we're loading is different than the previous selected list
            this.tps.clearAllTransactions();
        }
        this.view.updateToolbarButtons(this);
    }

    loadLists() {
        // CHECK TO SEE IF THERE IS DATA IN LOCAL STORAGE FOR THIS APP
        let recentLists = localStorage.getItem("recent_work");
        this.view.updateToolbarButtons(this);

        if (!recentLists) {
            return false;
        }
        else {
            let listsJSON = JSON.parse(recentLists);
            this.top5Lists = [];
            for (let i = 0; i < listsJSON.length; i++) {
                let listData = listsJSON[i];
                let items = [];
                for (let j = 0; j < listData.items.length; j++) {
                    items[j] = listData.items[j];
                }
                this.addNewList(listData.name, items);
            }
            this.sortLists();   
            this.view.refreshLists(this.top5Lists);
            return true;
        }
        
        
    }
    //updates the new lists in local storage
    saveLists() {
        let top5ListsString = JSON.stringify(this.top5Lists);
        localStorage.setItem("recent_work", top5ListsString);
    }

    restoreList() {
        this.view.update(this.currentList);
    }

    addChangeItemTransaction = (id, newText) => {
        // GET THE CURRENT TEXT
        let oldText = this.currentList.items[id];
        if (oldText!==newText) {
            let transaction = new ChangeItem_Transaction(this, id, oldText, newText);
            this.tps.addTransaction(transaction);
            this.view.updateToolbarButtons(this);
        }
        else {
            this.view.update(this.currentList);
        }
    }

    //change the text of the item.
    changeItem(id, text) {
        this.currentList.items[id] = text;
        this.view.update(this.currentList);
        this.saveLists();
    }

    //change the name of the list
    changeListName(id,text) {
        this.getList(this.getListIndex(id)).setName(text); //change the name of the list that's being changed
        this.sortLists();
        this.view.refreshLists(this.top5Lists);
        this.saveLists();
        this.view.highlightList(id);
        this.statusbarUpdate();
        
        
    }

    //delete a list
    deleteList(index) {
        
        let curListId;
        if(this.currentList!=null && this.getListIndex(this.currentList.id) === index) { //if the index of the currentList is the same as the index of the list that's
            //being deleted then clear the workspace
            this.view.clearWorkspace(); //clears all the items from the right hand side
            this.tps.clearAllTransactions();
            this.currentList=null; //sets currentList to nul
        }            
        else if (this.currentList!=null){
            //if the index of the currentList and the list to be deleted are different then keep track of the currentlist id. 
            curListId = this.currentList.id;
        }
        
        //index of the list to be deleted
        this.top5Lists.splice(index,1);
    
        this.view.refreshLists(this.top5Lists); 
        if (curListId!=null) { //it will be null when the current list and deleted list were the saame, otherwise re-highlight the currentlist
            this.view.highlightList(curListId); 
        }
        this.view.updateToolbarButtons(this);
        this.saveLists();
        

    }

    // SIMPLE UNDO/REDO FUNCTIONS
    undo() {
        if (this.tps.hasTransactionToUndo()) {
            this.tps.undoTransaction();
            this.view.updateToolbarButtons(this);
        }
    }
    redo() {
        if (this.tps.hasTransactionToRedo()) {
            this.tps.doTransaction();
            this.view.updateToolbarButtons(this);
        }
    }

    mouseOverHighlight(id) {
        this.view.mouseOverHighlight(id);
    }
    mouseOverUnhighlight(id) {
        this.view.mouseOverUnhighlight(id);
    }

    addMoveItemTransaction = (start,target) => {
        if (start!==target) {
            let transaction = new MoveItem_Transaction(this, start, target);
            this.tps.addTransaction(transaction);
            this.view.updateToolbarButtons(this);
        }

    }
    moveItem(start,target) {
        this.currentList.moveItem(start,target);
        this.restoreList();
        this.saveLists();
    }
    
    statusbarUpdate() {
        let statusbar = document.getElementById("top5-statusbar");
        statusbar.innerHTML = "";
        let txt = document.createTextNode("Top 5 " + this.currentList.getName());
        statusbar.appendChild(txt);
    }
}