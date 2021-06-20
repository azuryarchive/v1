function section(){document.onclick=function(e){const t=document.getElementById(e.target.getAttribute("data-section"));t.classList.add("selected"),t.scrollIntoView(),setTimeout((function(){t.classList.remove("selected")}),1e3)}}const docs=[{category:"General",routes:[{id:"introduction",title:"Introduction",description:"These are the official docs for our API, which are always being updated, optimized and adjusted. Please note the license, rate limits, and how to authorize before moving on."},{id:"base",title:"Base URL",url:"https://azury.gg/api"},{id:"license",title:"License",description:'You may use our API for non-commercial, personal, non-profit, or educational purposes. However, you may not use our service for commercial, business purposes without request. Should you nevertheless wish to integrate our service into such a product, please submit a request to <a class="link" href="mailto:developers@azury.gg">developers@azury.gg</a>. <br><br> Regardless of what you embed our service in, we explicitly ask you for an acknowledgment, which must be visibly embedded in your product. This reference can be included on the official website of the product, the imprint, or any other clearly recognizable area.'},{id:"ratelimits",title:"Ratelimits",description:"There's a maximum of 30 requests per minute. However, this limit is per route, meaning it isn't global. However, depending on the case, we may block requests or modify the rate limit over time."},{id:"authorization",title:"Authorization",description:"Additionally, to authenticate yourself, please add your token as an attachment after each request.",url:"<b>&lt;base&gt;&lt;route&gt;</b>?token=<b>&lt;token&gt;</b>"}]},{category:"Libraries",routes:[{id:"jsLibrary",title:"Azury.js",description:"Library built for Node.js applications that gives you an easy way to interact with our API."},{id:"pyLibrary",title:"Azury.py",description:"Library created for Python applications providing you with an elegant way to interact with our API."}]},{category:"Product",routes:[{id:"jsLibraryVersion",title:"Get Azury.js Version",type:"GET",url:"/product/azury.js/version"},{id:"pyLibraryVersion",title:"Get Azury.py Version",type:"GET",url:"/product/azury.py/version"},{id:"productStatistics",title:"Get Product Statistics",type:"GET",url:"/product/statistics"}]},{category:"Users",routes:[{id:"userUpload",title:"Upload File",type:"POST",token:!0,description:"Submit a request including the required parameter with the file object of a size of max. 50 MB.",url:"/users/files/new",parameter:"upload"},{id:"userShort",title:"Get Short Link",type:"GET",token:!0,url:"/users/files/<b>&lt;id&gt;</b>"},{id:"userFiles",title:"Get Files",type:"GET",token:!0,url:"/users/files"},{id:"userTeams",title:"Get Teams",type:"GET",token:!0,url:"/users/teams"},{id:"toggleFavorite",title:"Toggle Favorite Status",type:"PUT",token:!0,url:"/users/files/<b>&lt;id&gt;</b>/status/favorite/toggle"},{id:"toggleArchived",title:"Toggle Archived Status",type:"PUT",token:!0,url:"/users/files/<b>&lt;id&gt;</b>/status/archived/toggle"},{id:"toggleTrashed",title:"Toggle Trashed Status",type:"PUT",token:!0,url:"/users/files/<b>&lt;id&gt;</b>/status/trashed/toggle"},{id:"userClone",title:"Clone File",type:"PUT",token:!0,url:"/users/files/<b>&lt;id&gt;</b>/clone"},{id:"userGetFile",title:"Get File",type:"GET",token:!0,url:"/users/files/<b>&lt;id&gt;</b>"},{id:"userRenameFile",title:"Rename File",type:"POST",token:!0,description:"Submit a request including the required parameter with the new name as its value.",url:"/users/files/<b>&lt;id&gt;</b>/rename",parameter:"name"},{id:"userDeleteFile",title:"Delete File",type:"DELETE",token:!0,url:"/users/files/<b>&lt;id&gt;</b>/delete"},{id:"userData",title:"Get Data",type:"GET",token:!0,url:"/users/data"},{id:"deleteUser",title:"Delete User",type:"DELETE",token:!0,description:"Triggers the deletion of your account and divvents you from re-registering for up to 30 days.",url:"/users/delete"}]},{category:"Teams",routes:[{id:"createTeam",title:"Create Team",type:"POST",token:!0,description:"Submit a request including the required parameter with the name of your new team.",url:"/teams/new",parameter:"name"},{id:"renameTeam",title:"Rename Team",type:"POST",token:!0,description:"Submit a request including the required parameter with the new name of that team.",url:"/teams/<b>&lt;id&gt;</b>/rename",parameter:"name"},{id:"transferTeam",title:"Transfer Team",type:"PUT",token:!0,description:"Transfer a team to another user. Therefore replace <span>&lt;user&gt;</span> in the below sample with the user id, e.g. <span>567422331132313601</span>, or the username of the user, e.g. <span>@username</span>.",url:"/teams/<b>&lt;id&gt;</b>/transfer/<b>&lt;user&gt;</b>"},{id:"leaveTeam",title:"Leave Team",type:"PUT",token:!0,url:"/teams/<b>&lt;id&gt;</b>/leave"},{id:"deleteTeam",title:"Delete Team",type:"DELETE",token:!0,description:"Delete a specific team including all its files.",url:"/teams/<b>&lt;id&gt;</b>/delete"},{id:"addMember",title:"Add Member",type:"PUT",token:!0,description:"Add a new user to a team. Therefore replace <span>&lt;user&gt;</span> in the below sample with the user id, e.g. <span>567422331132313601</span>, or the username of the user, e.g. <span>@username</span>.",url:"/teams/<b>&lt;id&gt;</b>/members/add/<b>&lt;user&gt;</b>"},{id:"removeMember",title:"Remove Member",type:"PUT",token:!0,description:"Remove a user from a team. Therefore replace <span>&lt;user&gt;</span> in the below sample with the user id, e.g. <span>567422331132313601</span>, or the username of the user, e.g. <span>@username</span>.",url:"/teams/<b>&lt;id&gt;</b>/members/remove/<b>&lt;user&gt;</b>"},{id:"teamUpload",title:"Upload File",type:"POST",token:!0,description:"Submit a request including the required parameter with the file object of a size of max. 50 MB.",url:"/teams/<b>&lt;id&gt;</b>/files/new",parameter:"upload"},{id:"getTeam",title:"Get Team",type:"GET",token:!0,url:"/teams/<b>&lt;id&gt;</b>"},{id:"teamFiles",title:"Get Files",type:"GET",token:!0,url:"/teams/<b>&lt;id&gt;</b>/files"},{id:"teamMembers",title:"Get Members",type:"GET",token:!0,url:"/teams/<b>&lt;id&gt;</b>/members"},{id:"teamShort",title:"Get Short Link",type:"GET",token:!0,url:"/teams/files/<b>&lt;id&gt;</b>/short"},{id:"teamClone",title:"Clone File",type:"PUT",token:!0,url:"/teams/files/<b>&lt;id&gt;</b>/clone"},{id:"teamGetFile",title:"Get File",type:"GET",token:!0,url:"/teams/files/<b>&lt;id&gt;</b>"},{id:"teamRenameFile",title:"Rename File",type:"POST",token:!0,description:"Submit a request including the required parameter with the new name of that file.",url:"/teams/files/<b>&lt;id&gt;</b>/rename",parameter:"name"},{id:"teamDeleteFile",title:"Delete File",type:"DELETE",token:!0,url:"/teams/files/<b>&lt;id&gt;</b>/delete"}]},{category:"Accountless",routes:[{id:"accountlessUpload",title:"Upload File",type:"POST",token:!0,description:"Submit a request including the required parameter with the file object of a size of max. 25 MB.",url:"/accountless/files/new",parameter:"upload"},{id:"accountlessGetFile",title:"Get File",type:"GET",token:!0,url:"/accountless/files/<b>&lt;id&gt;</b>"}]}];docs.forEach((e=>{const t=document.querySelector(".docs-q63mlc"),i=document.createElement("div");i.classList.add("category-ia00vk");const r=document.createElement("h2");r.innerHTML=e.category,i.appendChild(r),t.appendChild(i),e.routes.forEach((e=>{const t=document.createElement("div");t.classList.add("childItem-7k1itc");const r=document.createElement("h3");if(r.innerHTML=e.title,t.appendChild(r),e.description){const i=document.createElement("p");i.innerHTML=e.description,t.appendChild(i)}if(e.type){const t=document.createElement("span");t.innerHTML=e.type,r.appendChild(t)}if(e.token){const e=document.createElement("span");e.innerHTML="Token",r.appendChild(e)}if(e.url){const i=document.createElement("div");i.classList.add("code-0e6a12"),i.innerHTML=e.url,t.appendChild(i)}if(e.parameter){const i=document.createElement("p");i.innerHTML=`Parameter: <span>${e.parameter}</span>`,t.appendChild(i)}const a=document.createElement("div");a.classList.add("item-7vp4du"),a.id=e.id,a.appendChild(t),i.appendChild(a)}))})),docs.forEach((e=>{const t=document.querySelector(".sidebar-nxgj4o"),i=document.createElement("h3");i.innerHTML=e.category,t.appendChild(i);const r=document.createElement("ul");t.appendChild(r),e.routes.forEach((e=>{const t=document.createElement("li");t.innerHTML=e.title,t.setAttribute("onclick","section()"),t.setAttribute("data-section",e.id),r.appendChild(t)}))}));
