var jsc = {
  //hide/show an element using aria properties
  setVisibility: function(element, visible) {
    element.setAttribute("aria-hidden", !visible);
  },
  setExpandedState: function(element, expanded) {
    element.setAttribute("aria-expanded", !expanded);
  },
  sanitiseRegEx: function (s) {
    return s.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
  },
  keyModiferActive: function(event) {
    return event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey;
  },
};

jsc.tabList = (function() {
  /* Properties */

  //index value for local storage. Uses the current URL to uniquely mark the page
  //potential problem here where the URL changes
  var _storageIndex = "selectedTabPanel" + document.location;

  /* Constructor Helpers */

  // First run setup
  function _setup() {
    //make all tablist anchors unselectable and label all tabs with their role
    var tabListAnchors = document.querySelectorAll(".jsc-tab__tab-list a");
    for (var h=0; h < tabListAnchors.length; h++) {
      tabListAnchors[h].setAttribute("tabindex", "-1");
      tabListAnchors[h].parentElement.setAttribute("role", "tab");
      tabListAnchors[h].parentElement.parentElement.setAttribute("role", "tablist");
    }

    //fetch previously selected tabs
    var currentTabs = _getCurrentTabs();

    //fetch all tab groups
    var tabGroups = document.querySelectorAll(".jsc-tab__tab-group");

    //initialise tabs
    for (var i=0; i < tabGroups.length; i++) {
      //hide tab panels (for all tab groups)
      var tabPanels = tabGroups[i].querySelectorAll(".jsc-tab__tab-panel");

      //stores if any tab is currently shown
      var anyShown = false;

      for (var j=0; j < tabPanels.length; j++) {
        //tab associated with this tab panel
        var associatedTab = document.querySelector(".jsc-tab__tab a[href='#" + tabPanels[j].id + "']");

        //if tab panel ID is not in currentTabs
        if (currentTabs.indexOf("#" + tabPanels[j].id) === -1) {
          //hide it
          jsc.setVisibility(tabPanels[j]);
          //remove from tab order
          associatedTab.parentElement.setAttribute("tabindex", "-1");
        } else {
          //leave it visible
          anyShown = true;
          tabPanels[j].setAttribute("role", "tabpanel");
          tabPanels[j].setAttribute("tabindex", "0");
          //select
          associatedTab.parentElement.setAttribute("aria-selected", "true");
          //restore to tab order
          associatedTab.parentElement.setAttribute("tabindex", "0");
        }
      }

      //if any tab panels are selected, we're done
      if (anyShown) {
        continue;
      }

      //select the first tab as default

      //show the first tab panel
      jsc.setVisibility(tabPanels[0], true);
      tabPanels[0].setAttribute("tabindex", "0");
      tabPanels[0].setAttribute("role", "tabpanel");

      //select first tab
      var firstTab = tabGroups[i].querySelectorAll(".jsc-tab__tab")[0];
      firstTab.setAttribute("aria-selected", "true");
      firstTab.setAttribute("tabindex", "0");
    }
  }

  // Event binding
  function _bind() {
    var tabs = document.querySelectorAll(".jsc-tab__tab");
    //if any of the tabs are clicked run activateTab
    for (var i=0; i < tabs.length; i++) {
      tabs[i].addEventListener("click", _activateTab);
      //this is what should work but support is shaky in testing
      tabs[i].addEventListener("keydown", _handleKeyEvents);
    }
  }

  /* Event Handlers */

  function _handleKeyEvents(event) {
    if (!event) {
      event = window.event;
    }

    //ignore keys if modifiers are active
    if (jsc.keyModiferActive(event)) {
      return;
    }

    var code = event.key || event.charCode || event.keyCode;

    switch(code) {
      case "Left":
      case "ArrowLeft":
      case 37:
        // Key left.
        _switchTab(this.previousElementSibling, event);
        break;
      case "Right":
      case "ArrowRight":
      case 39:
        // Key right.
        _switchTab(this.nextElementSibling, event);
        break;
      default:
    }
  }

  /* Methods */

  function _switchTab(sibling, event) {
    if (!sibling || !sibling.classList.contains("jsc-tab__tab")) {
      return;
    }

    //set focus on the prev tab
    sibling.focus();
    sibling.click();
    event.preventDefault();
  }

  function _activateTab(event) {
    //check if there are any tab groups on the page
    var tabGroup = this.parentElement.parentElement;

    if (!tabGroup.classList.contains("jsc-tab__tab-group")) {
      //Argh! Broken HTML
      throw "HTML does not contain correct class for tab group. Documentation is at http://jltui.azurewebsites.net/web/tabs";
    }

    //get currently selected tabs
    var currentTabs = _getCurrentTabs();

    //deselect old clicked tab
    var oldTabPanelID;
    for (var i=0; i < this.parentElement.children.length; i++) {
      if (this.parentElement.children[i].hasAttribute("aria-selected")) {
        //store old tab for later
        oldTabPanelID = this.parentElement.children[i].firstChild.getAttribute("href");
        //deselect
        this.parentElement.children[i].removeAttribute("aria-selected");
        this.parentElement.children[i].setAttribute("tabindex", "-1");
        break;
      }
    }

    //hide old tab panel
    var oldTabPanel = document.querySelector(oldTabPanelID);
    oldTabPanel.setAttribute("aria-hidden", "true");
    oldTabPanel.setAttribute("tabindex", "-1");

    //remove old tab ID from storage
    var tabIndex = currentTabs.indexOf(oldTabPanelID);
    if (tabIndex > -1) {
      currentTabs.splice(tabIndex, 1);
    }

    //select new clicked tab
    this.setAttribute("aria-selected", "true");
    this.setAttribute("tabindex", "0");

    //show new tab panel
    var newTabPanelID = this.firstChild.getAttribute("href");

    //show new tab
    var newTabPanel = document.querySelector(newTabPanelID);
    newTabPanel.setAttribute("aria-hidden", "false");
    newTabPanel.setAttribute("tabindex", "0");

    //add new tab to storage
    currentTabs.push(newTabPanelID);
    localStorage.setItem(_storageIndex, currentTabs.join());

    //prevent hash change
    event.preventDefault();
  }

  function _getCurrentTabs() {
    var currentTabs = [];
    var storedTabs = localStorage.getItem(_storageIndex);
    if (storedTabs) {
      currentTabs = storedTabs.split(",");
    }
    return currentTabs;
  }

  /* Public Methods */
  return {
    init: function() {
      //if tab groups don't exist, go no further
      if (!document.querySelector(".jsc-tab__tab-group")) {
        return;
      }
      _setup();
      _bind();
    }
  };
})();

document.addEventListener("DOMContentLoaded", function() {
  jsc.tabList.init();
});
