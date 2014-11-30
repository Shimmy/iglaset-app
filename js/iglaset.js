
var sort_by = "";
var article_id = 0;
var search_str = "";
var action = "";
var categories_populated = false;
var last_producer=0;
function logout() {
	
	window.localStorage.removeItem("token");
	window.localStorage.removeItem("user_id");
	window.localStorage.removeItem("username");

	window.location ="index.html";
    location.reload();
}

function login(havetoken) {
	if (!havetoken) {
	username = $("#username").val();
	password = $("#password").val();
	$.post("http://beta.iglaset.se/user_sessions.xml", { "user_session[username]": username, "user_session[password]": password }, function(xml) {
		if ($(xml).find('result').text() != "Success") {
			window.localStorage.removeItem("token");
			window.localStorage.removeItem("user_id");
			window.localStorage.removeItem("username");
			$("#login-error").show();
		} else {
			token = $(xml).find('token').text();
			user_id = $(xml).find('user_id').text();		

			window.localStorage.setItem("token", token);
			window.localStorage.setItem("user_id", user_id);
			window.localStorage.setItem("username", username);
			$("#logged-in-user").html(username);
			$("#login-error").hide();
			$("#login-res").hide();
			$("#success-login").show();
			$("#settings-button").show();			
			$("#do-login").hide();
			$.mobile.changePage("#welcome-page");
			update_recommendations();
		}
	});
	}
	if (havetoken) {
		$("#logged-in-user").html(window.localStorage.getItem("username"));
		$("#success-login").show();
		$("#settings-button").show();					
		$("#do-login").hide();
	}
}

function get_categories() {
	if (!categories_populated) {
		$.mobile.loading('show');
		$("#categories").html("");
		$.get("http://beta.iglaset.se/categories.xml", function(xml) {
		 $(xml).find('category').each(function(){
		 	var name = $(this).find('name').text();
		 	var cat_id = $(this).find('id').text();
		  	$("#categories").append("<li><a onclick='view_articles_by_cat("+cat_id+", 1)' href='#'>"+name+"</a></li>").listview("refresh");
			$.mobile.loading('hide');
			categories_populated = true;
		});

		}, "xml");
	}
}

var stores_populated = false;

function get_stores() {
	if (!stores_populated) {
		$.mobile.loading('show');
		$("#stores").html("");
		var a=0;
		$.get("http://beta.iglaset.se/ajax/get_stores", function(xml) {
			 $(xml).find('object').each(function(){
			 	store_id = $(this).find("store-id").text();
			 	store_name = $(this).find("store-name").text();
			 	$("#stores").append('<li><a onclick=\'set_preferred_store("'+store_id+'")\' id=\'store-'+store_id+'\' href=\'#\'>'+store_name+'</a></li>');
			 	if (a>1000) {
			 		return false;
			 	}
			 	a++;
			 });
		}, "xml").always(function () {
			stores_populated = true;
			$("#stores").listview('refresh');
			$.mobile.loading('hide');
		});
	}
}
function set_preferred_store(store_id) {
	window.localStorage.setItem("store_id", store_id)	
	window.localStorage.setItem("store_name", $("#store-"+store_id).html());	
	$.mobile.changePage("#settings-page");
}

function view_articles(str, page) {
	action = "view_articles";
	if (str.length>1) {
		$.mobile.loading('show');
		$("#comment-list").hide();
		$("#article-view").hide();
		if (page==1) {
			$("#articles").html("");
			$("#search-res-more-button").hide();		
		}

		$("#search-res").trigger('expand').trigger('updatelayout');
		$.get("http://beta.iglaset.se/articles.xml?order_by="+sort_by+"&user_credentials="+window.localStorage.getItem("token")+"&page="+page+"&search=true&str="+str, function(xml) {
		 	article_line(xml, "articles");
			$("#search-res-more-button").show();		
		 	page = parseInt(page)+1;
		 	var tot_art = $(xml).find('articles').attr("total_articles");
		 	pages = tot_art/10;
		 	if (pages < (page-1)) {
					$("#search-res-more-button").hide();		
			}
			$("#search-res-more-button").html("<button onclick='view_articles(\""+str+"\","+page+");'>Hämta fler (sida "+page+" av "+Math.ceil(pages)+")</button>").trigger('create');
					 
			$("#articles").listview("refresh");
			articles_by_cat_no_data = true;
		}, "xml").always(function() {
			$.mobile.loading('hide');
			$("#articles").show();
			$("#search-res").show();
		}).fail(function(){
			$("#articles").append("<li style='margin-left:20px;margin-top:100px;'>Din sökning genererade inga resultat</li>");
		});
	}
}
function view_articles_by_producer(pid, page) {
	action = "view_articles_by_producer";
	last_producer = pid;
	if (page==1) {
		$("#articles").html("");
		$("#search-res-more-button").hide();		
	}
	$.mobile.changePage("#search-res-page");

	$.mobile.loading('show');
	$.get("http://beta.iglaset.se/articles.xml?order_by="+sort_by+"&user_credentials="+window.localStorage.getItem("token")+"&page="+page+"&producer_id="+pid, function(xml) {
	 	article_line(xml, "articles");
		$("#search-res-more-button").show();		
	 	page = parseInt(page)+1;
	 	var tot_art = $(xml).find('articles').attr("total_articles");
	 	pages = tot_art/10;
	 	if (pages < (page-1)) {
				$("#search-res-more-button").hide();		
		}
		$("#search-res-more-button").html("<button onclick='view_articles_by_producer("+pid+","+page+");'>Hämta fler (sida "+page+" av "+Math.ceil(pages)+")</button>").trigger('create');
		$("#articles").listview("refresh");

	}, "xml").always(function() {

			$.mobile.loading('hide');
			articles_by_cat_no_data = true;
			articles_by_cat_no_data_cat = 0;
		}).fail(function(){
			$.mobile.loading('hide');
			articles_by_cat_no_data = true;
			$("#articles").append("<li style='margin-left:20px;margin-top:100px;'>Din sökning genererade inga resultat</li>");
		});;

}

var articles_by_cat_no_data = true;
var articles_by_cat_no_data_cat = 0;
var selected_cat = 0;
function view_articles_by_cat(cat, page) {
	action = "view_articles_by_cat";

	$.mobile.changePage("#search-res-page");
	$.mobile.loading('show');
	selected_cat = cat;
	if (articles_by_cat_no_data || page!=1 || articles_by_cat_no_data_cat != cat) {
	if (page==1) {
		$("#articles").html("");
		$("#search-res-more-button").hide();		
	}
	$.get("http://beta.iglaset.se/articles.xml/cat/?user_credentials="+window.localStorage.getItem("token")+"&page="+page+"&category="+cat+"&order_by="+sort_by, function(xml) {
	 	article_line(xml, "articles");
		$("#search-res-more-button").show();		
	 	page = parseInt(page)+1;
	 	var tot_art = $(xml).find('articles').attr("total_articles");
	 	pages = tot_art/10;
	 	if (pages < (page-1)) {
				$("#search-res-more-button").hide();		
		}
		$("#search-res-more-button").html("<button onclick='view_articles_by_cat("+cat+","+page+");'>Hämta fler (sida "+page+" av "+Math.ceil(pages)+")</button>").trigger('create');
		$("#articles").listview("refresh");

	}, "xml").always(function() {

			articles_by_cat_no_data = true;
			articles_by_cat_no_data_cat = 0;
			$.mobile.loading('hide');
		}).fail(function(){
			articles_by_cat_no_data = true;
			$("#articles").append("<li style='margin-left:20px;margin-top:100px;'>Din sökning genererade inga resultat</li>");
			$.mobile.loading('hide');
		});;
	}
}

var basement_no_data = true;
function basement_list(page) {

	uid = parseInt(window.localStorage.getItem("user_id"))
	if (basement_no_data || page != 1) {
		
	if ( uid>0) {
	$.mobile.changePage("#basement-list-page");

	if (page==1) {
		$("#basement-more-button").hide();
		$("#basement-list").html("");
	}
	$.mobile.loading('show');
	$.get("http://beta.iglaset.se/users/"+uid+".xml?show=basement&user_credentials="+window.localStorage.getItem("token")+"&page="+page, function(xml) {
	 	article_line(xml, "basement-list");
		$("#basement-more-button").show();		
	 	page = parseInt(page)+1;
	 	var tot_art = $(xml).find('articles').attr("total_articles");
	 	pages = tot_art/10;
	 	if (pages < (page-1)) {
				$("#basement-more-button").hide();		
		}
		$("#basement-more-button").html("<button onclick='basement_list("+page+");'>Hämta fler (sida "+page+" av "+Math.ceil(pages)+")</button>").trigger('create');

	}, "xml").always(function() {
			$.mobile.loading('hide');
			basement_no_data = false;
			$("#basement-list").listview("refresh");

		}).fail(function(){
			$.mobile.loading('hide');
			basement_no_data = true;			
			$("#basement-list").append("<li style='margin-left:20px;margin-top:100px;'>Din källare är tom!</li>");
		});
	} else {
		$.mobile.changePage("#login-page");
		return false;
	}
}
}
var purchase_no_data = true;
function purchase_list(page) {

	uid = parseInt(window.localStorage.getItem("user_id"))
	if (purchase_no_data || page != 1) {

		if ( uid>0) {
			if (page==1) {
				$("#purchase-more-button").hide();
				$("#purchase-list").html("");
			}

			$.mobile.loading('show');
			$.get("http://beta.iglaset.se/users/"+uid+".xml?show=purchase&user_credentials="+window.localStorage.getItem("token")+"&page="+page, function(xml) {
			 	article_line(xml, "purchase-list");
			 	$("#purchase-more-button").show();		
			 	page = parseInt(page)+1;
			 	var tot_art = $(xml).find('articles').attr("total_articles");
			 	pages = tot_art/10;
			 	if (pages < (page-1)) {
						$("#purchase-more-button").hide();		
				}
				$("#purchase-more-button").html("<button onclick='purchase_list("+page+");'>Hämta fler (sida "+page+" av "+Math.ceil(pages)+")</button>").trigger('create');


			}, "xml").always(function() {
					$.mobile.loading('hide');
					purchase_no_data = false;
					$("#purchase-list").listview("refresh");


				}).fail(function(){
					purchase_no_data = true;			
					$("#purchase-list").append("<li style='margin-left:20px;margin-top:100px;'>Din inköpslista är tom!</li>");
				});
		} else {
			$.mobile.changePage("#login-page");
			return false;

		}
	}
	$.mobile.changePage("#purchase-list-page");		

}
function sorting() {
	if (action == "get_user_ratings") {
		$('#sort-ur-popup').popup("open", {positionTo: '#category-list'});
	} else {
		$('#sort-popup').popup("open", {positionTo: '#category-list'});
	}

}
function sort_click(sort) {
	if (sort == "producer") {
		sort_name = "Producent";
	}
	if (sort == "default") {
		if (action == "get_user_ratings")
		{
			sort_name = "Betygsatt datum";
		} else {
			sort_name = "Skapad";
		}
	}
	if (sort == "average") {
		sort_name = "Medelbetyg";
	}
	if (sort == "recommendation") {
		sort_name = "Rekommendation";
	}
	if (sort == "name") {
		sort_name = "Namn";
	}
	if (sort == "rating") {
		sort_name = "Betyg";
	}	
	$('#sort-button').text("Sortering ("+sort_name+")");	
	sort_by = sort;
	if (action == "view_articles_by_producer") {
		$('#sort-popup').popup("close");

		view_articles_by_producer(last_producer, 1);

	} else if (action == "view_articles") {
		$('#sort-popup').popup("close");
		view_articles($("#search-str").val(), 1);

	} else if (action == "view_articles_by_cat") {
		$('#sort-popup').popup("close");
		view_articles_by_cat(selected_cat, 1);
	} else if (action == "get_user_ratings") {
		$('#sort-ur-popup').popup("close");
		ratings_no_data = true;
		get_user_ratings(1);
	}
}
var filters_loaded=false;
function filter() {
	if(!filters_loaded) {
		$.get("http://beta.iglaset.se/categories.xml", function(xml) {
	  	$("#category-list").append("<li><a onclick=\"filter_click(0, 'Alla')\" href='#'>Alla</a></li>");

		 $(xml).find('category').each(function(){
		 	var name = $(this).find('name').text();
		 	var cat_id = $(this).find('id').text();
		  	$("#category-list").append("<li><a onclick=\"filter_click("+cat_id+", '"+name+"')\" href='#'>"+name+"</a></li>");

		});
		$.mobile.loading('hide');
		$("#category-list").listview();
		filters_loaded = true;
	});
	}
	$('#filter-popup').popup("open", {positionTo: '#category-list'});

}
function filter_click(cat, name) {
//	$.mobile.changePage("#recommendations-res-page");
	$('#filter-popup').popup("close");
	$('#filter-button').text("Filter ("+name+")");
	recommended_no_data=true;	
	get_recommended_articles(1, cat);
}
var recommended_no_data=true;

function get_recommended_articles(page, cat) {
	$("#recommendations-reload-button").html("<button onclick='force_calculate_recommendations();'>Kalkylera om rekommendationer</button>").trigger('create');
	if ($("#calculating").css('display') == 'none') {
		$("#recommendations-reload-button").show();
	} else {
		$("#recommendations-reload-button").hide();
	}
	if (recommended_no_data || page!=1) {
	uid = parseInt(window.localStorage.getItem("user_id"))
	if ( uid>0) {
	//	$.mobile.changePage("#recommendations-res-page");
		if (page==1) {
			$("#recommendations-more-button").hide();
			$("#recommendations").html("");
		}
		//$("#recommendations-res").trigger('expand').trigger('updatelayout');
		$.mobile.loading('show');
		//$.get("http://www.iglaset.se/users/"+uid+".xml?cat="+cat+"&page="+page+"&show=recommendations&user_credentials="+window.localStorage.getItem("token"), function(xml) {
			if (parseInt(cat) == 0 || cat==undefined || parseInt(cat) == NaN) {
				catfilter = "";
				cat = 0;
			} else {
				catfilter = "category="+cat+"&";
			}
		$.get("http://beta.iglaset.se/users/mypage.xml?show=recommendations&"+catfilter+"page="+page+"&order_by=recommendation&user_credentials="+window.localStorage.getItem("token"), function(xml) {			
			article_line(xml, "recommendations");

		 	$("#recommendations-more-button").show();		
		 	page = parseInt(page)+1;
		 	var tot_art = $(xml).find('articles').attr("total_articles");
		 	pages = tot_art/10;
		 	if (pages < (page-1)) {
					$("#recommendations-more-button").hide();		
			}
			$("#recommendations-more-button").html("<button onclick='get_recommended_articles("+page+","+parseInt(cat)+");'>Hämta fler (sida "+page+" av "+Math.ceil(pages)+")</button>").trigger('create');

		}, "xml").always(function() {
			$.mobile.loading('hide');
			recommended_no_data = false;
			$("#recommendations").listview("refresh");

		}).fail(function(){
			recommended_no_data = true;
			$("#recommendations").append("<li style='margin-left:20px;margin-top:100px;'>Du har inga rekommendationer än!</li>");
		});
	} else {
		recommended_no_data = true;		
		$.mobile.changePage("#login-page");
	}}

}

var ratings_no_data = true;
function get_user_ratings(page) {
	action = "get_user_ratings";
	if (sort_by == "") {
		sort_by = "date";
	}
	uid = parseInt(window.localStorage.getItem("user_id"))
	if (ratings_no_data || page != 1) {
		if ( uid>0) {
			$.mobile.changePage("#user-ratings-res-page");
			if (page==1) {
				$("#user-ratings-more-button").hide();
				$("#user-ratings").html("");
			}
			//$("#recommendations-res").trigger('expand').trigger('updatelayout');
			$.mobile.loading('show');
			$.get("http://beta.iglaset.se/users/"+uid+".xml?page="+page+"&order_by="+sort_by+"&show=ratings&user_credentials="+window.localStorage.getItem("token"), function(xml) {
				article_line(xml, "user-ratings");
		
			 	$("#user-ratings-more-button").show();		
			 	page = parseInt(page)+1;
			 	var tot_art = $(xml).find('articles').attr("total_articles");
			 	pages = tot_art/10;
			 	if (pages < (page-1)) {
						$("#user-ratings-more-button").hide();		
				}
				$("#user-ratings-more-button").html("<button onclick='get_user_ratings("+page+");'>Hämta fler (sida "+page+" av "+Math.ceil(pages)+")</button>").trigger('create');

			//	$("#recommendations-res").show();
			}, "xml").always(function() {
				$.mobile.loading('hide');
				ratings_no_data = false;
				$("#user-ratings").listview("refresh");

			}).fail(function(){
				ratings_no_data = true;			
				$("#user-ratings").append("<li style='margin-left:20px;margin-top:100px;'>Du har inte betygsatt något än!</li>");
			});
		} else {
			$.mobile.changePage("#login-page");
		}
	}
}

var producer_id=0;
function get_article(artid) {
	$.mobile.loading('show');
	$("#store-list-message").html("");
   	$.get("http://beta.iglaset.se/articles/"+artid+".xml?user_credentials="+window.localStorage.getItem("token"), function(xml) {
		//$("#article-view").html("");
	 	var art_id = $(xml).find('article').attr("id");
	 	var image = urldecode($(xml).find('medium').text());
	 	var origin = $(xml).find('origin').text();
	 	var name = $(xml).find('name').text();
	 	var bigimage = urldecode($(xml).find('large').text());
	 	var origin_country = $(xml).find('origin_country').text();
	 	var commercial_desc = $(xml).find('commercial_desc').text();
	 	var supplier = $(xml).find('supplier').text();
	 	var producer = $(xml).find('producer').text();
	 	producer_id = $(xml).find('producer').attr('id');
	 	var alc_percent = $(xml).find('alc_percent').text();
	 	var year = $(xml).find('year').text();
	 	var avg_rating = $(xml).find('avg_rating').text();
	 	var ratings = $(xml).find('ratings').text();
	 	var category = $(xml).find('category').text();
	 	var user_rating = $(xml).find('user_rating').text();
	 	var estimated_rating = $(xml).find('estimated_rating').text();
	 	var sb_short_artid = false;
	 	$("#av-popup-image").attr('src', image);
	 	$("#article-id").val(art_id);
	 	if (!user_rating) { user_rating="0";}
	 	if (!estimated_rating) { estimated_rating="0";}
	 	$("#av-category").text(category);
	 	$("#av-name").text(name);
	 	$("#av-img").attr('src', image);
	 	$("#av-origin").text(origin+" "+origin_country)
	 	if (producer_id) {
	 		$("#av-producer").html("<a href='#producer-page'>"+producer+"</a>");
	 	} else {
	 		$("#av-producer").text(producer);
	 	}
	 	$("#av-alc").text(alc_percent);
	 	if (parseInt(year)>0) {
	 		$("#av-year").text(year);
	 	} else { $("#av-year").hide().siblings().hide(); }
	 	$(".av-added").remove();
	 	$(xml).find("tag").each(function(){
	 		var tag_type = $(this).attr("type");
		 	var tag_value = $(this).text();

		 	$("#av-table").append("<tr class='av-added'><td>"+tag_type+"</td><td>"+tag_value+"</td></tr>");
	 	});
	 	var volumes_found = false;
	 	$(xml).find("volume").each(function(){
	 		var vol_price= $(this).attr("price");
	 		var vol_sbid= $(this).attr("sb_article_id");
	 		var vol_retired = parseInt($(this).attr("retired"))+1;
		 	var volume = $(this).text();
		 	if (vol_retired == 2) {
		 		retired_class = " av-retired";
		 	} else { 
	 			volumes_found = true;
		 		retired_class = "";
		 		sb_short_artid = vol_sbid.slice(0,-2);
		 	}
		 	$("#av-table").append("<tr class='av-added"+retired_class+"'><td>"+volume+" ml <span class='volumes-stock' id='"+retired_class+sb_short_artid+"-"+volume+"'/></td><td>"+vol_price+" Kr / "+vol_sbid+"</td></tr>");
	 	});	 	


	 		user_rating_icon = "<span class='badge badge-user-rating '>"+user_rating+"  <span class='glyphicon glyphicon-ok'></span></span>";
	 		avg_rating_icon = "<span class='badge badge-average-rating '>"+(avg_rating)+" <span class='glyphicon glyphicon-stats'></span></span>";
	 		nr_ratings_icon = "<span class='badge badge-nr-ratings '>"+ratings+" <span class='glyphicon glyphicon-star'></span></span>";
	 		if (estimated_rating > 4) {
 				estimated_rating_icon = "<span class='badge badge-est-rating '>"+estimated_rating+" <span class='glyphicon glyphicon-thumbs-up'></span></span>";
 			} else {
 				estimated_rating_icon = "<span class='badge badge-est-rating '>"+estimated_rating+" <span class='glyphicon glyphicon-thumbs-down'></span></span>";
 			}
	 	if (parseInt(user_rating)>0) {
		 	$("#av-table").append("<tr class='av-added'><td>Ditt betyg</td><td>"+user_rating_icon+"</td></tr>");
	 	}	
	 	if (parseInt(estimated_rating)>0) {
		 	$("#av-table").append("<tr class='av-added'><td>Uppskattat betyg</td><td>"+estimated_rating_icon+"</td></tr>");
	 	} else {
			// Get estimated rating if not exists
			uid = parseInt(window.localStorage.getItem("user_id"))
			$.getJSON( "http://www.vabba.nu/iglaset/vogoo/test.php?action=article&u="+uid+"&a="+artid, function( data ) {		
				if (data.rating >4) {
					thumb = "up";
				} else {
					thumb = "down";
				}
			 	$("#av-table").append("<tr class='av-added'><td>Uppskattat betyg</td><td><span class='badge badge-est-rating '>"+(data.rating)+" <span class='glyphicon glyphicon-thumbs-"+thumb+"'></span></span></td></tr>");			 

			}).fail(function(d,c) {
			});
	 	}
	 	if (parseInt(avg_rating)>0) {
		 	$("#av-table").append("<tr class='av-added'><td>Medelbetyg</td><td>"+avg_rating_icon+"</td></tr>");
	 	}	 		 	

	 	if (parseInt(ratings)>0) {
		 	$("#av-table").append("<tr class='av-added'><td>Antal betyg</td><td>"+nr_ratings_icon+"</td></tr>");
	 	}	 	
 		 	
	 	if (commercial_desc.length > 0) {
	 		$("#commercial_desc").html("<b>Leverantörens beskrivning:</b><br/>"+nl2br(commercial_desc));
	 	} else {
	 		$("#commercial_desc").html("");
	 	}
		//$("#article-view").append("<div data-role='popup' id='photopop"+art_id+"' class='photopopup'><img src='"+bigimage+"'/></div><h3>" + $(xml).find("name").text() + "</h3><div class='imgtbl'><div id='img'><a href='#photopop"+art_id+"' data-rel='popup'><img style='max-width:50px' src='"+unescape(image)+"'></a></div><div id='tbl'><table data-role='table' id='my-table' data-mode='repop'><tr><td>Kategori</td><td>"+category+"</td></tr><tr><td>Ursprung</td><td>"+origin+"</td></tr><tr><td>Producer</td><td>"+producer+"</td></tr><tr><td>Alkoholhalt</td><td>"+alc_percent+"</td></tr><tr><td>Årgång</td><td>"+year+"</td></tr><tr><td>Medelbetyg</td><td>"+avg_rating+"</td></tr><tr><td>Antal betyg</td><td>"+ratings+"</td></tr><tr><td>Ditt betyg</td><td>"+user_rating+"</td></tr><tr><td>Ditt upskattade betyg</td><td>"+estimated_rating+"</td></tr></table></div></div><div style='clear:both;'></div><p>"+nl2br(commercial_desc,true)+"</p><div style='clear:both;'></div><input type='hidden' id='article-id' value='"+art_id+"'><div id='rate-link'><a href='#popupRate' data-rel='popup' data-position-to='window' data-role='button' data-icon='star' data-transition='pop'>Betygsätt</a></div>").trigger('create');
		get_comments(artid);
		$("#article-stores").html("");
		$( "#store-list" ).collapsible({
		expand: function( event, ui ) {
		
			if (!volumes_found) {
				$('#store-list-message').html("Artikeln saknar koppling mot systembolaget");
				$('#store-list .ui-filterable').hide();
				$("#loading-stock-text").hide();
			} else if (!window.localStorage.getItem("store_id")) {
				$('#store-list-message').html("Välj ditt systembolag i <a href='#settings-page'>inställningar</a> först");
				$("#loading-stock-text").hide();
				$('#store-list .ui-filterable').hide();				
			} else {
				$("#loading-stock-text").show();

				check_store_avail();	
			}	
		}
		});
		$('#store-list').collapsible('collapse');
	
		$.mobile.loading('hide');

		//$("#photopop"+art_id).popup().trigger('create');;
		$("#article-content").show();
		$("#article-view").show();
		$("#comment-list").show();
		$("#store-list").show();
		$("#article-content").trigger('updatelayout');
		if (window.localStorage.getItem("user_id")) {
			$("#rate-link").show();
			$(".list-buttons").show();
		}
		$("#ean-button").hide();
		if (window.localStorage.getItem("latest_scanned_ean")) 
		{
			$("#ean-button").text("Koppla till senast scannad streckkod");
			$("#ean-button").show();
			window.localStorage.removeItem("latest_scanned_ean");

		}
		$("#article-view").trigger('expand').trigger('updatelayout');

	}).done(function() {
		$.mobile.loading('hide');
		});
}
function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}
function check_store_avail() {
		// Check store availibility
	$("#article-stores").html("");
	$("#article-stores").hide();
	$("#store-list input").val("");
	$("#store-list input").trigger("change");
	$('#store-list .ui-filterable').show();

	if (window.localStorage.getItem("store_id")) {
		var sb_art_ids = [];
		$(".volumes-stock").each(function(x) {
			vol_id = $(this).attr('id');
			parts = vol_id.split("-");
			sb_art_ids.push(parts[0]);
		});
		//sb_art_ids = jQuery.unique(sb_art_ids);
		var sb_art_ids = sb_art_ids.filter( onlyUnique )
    		var gets = [];
    		var cnt=0;
    		if (sb_art_ids.length == 0) {
    			$("#store-list-message").html("Hittade ingen information på systembolaget");
				$("#loading-stock-text").hide();	

    		}
			$(sb_art_ids).each(function(v,k) {
				if (k != "false") {
					gets.push($.get("http://beta.iglaset.se/ajax/get_store_stock?varunr="+k, function (xml) {
						t = $(xml).find("title").first().text().split("\"")[1];
						$("#article-stores").append("<li data-role='list-divider'>"+t+" (art-nr:"+k+"xx)</li>")

						$(xml).find('object').each(function(){
							store_id = $(this).find('store-id').text();
							store_name = $(this).find('store-name').text();
							amount = $(this).find('amount').text();
							vol = $(this).find('volume').text().match(/[0-9]+/g);
							if (store_id == window.localStorage.getItem("store_id")) {
								$("#"+k+"-"+vol).html(amount);
							}
							//if (store_name.split(",")[0] == window.localStorage.getItem("store_name").split(",")[0]) {
								$("#article-stores").append("<li>"+store_name+"<br/>"+vol+" ml <span class='ui-li-count'>"+amount+"</span></li>");
						//	}
						});
						
					}, 'xml'));
				}
					    $.when.apply($, gets).then(function() {
					    	if (cnt == sb_art_ids.length-1) {
								$("#article-stores").listview("refresh");					
								if (window.localStorage.getItem("store_name")) {
									$("#store-list input").val(window.localStorage.getItem("store_name").split(",")[0]);															
								} else {
									$("#store-list input").val("");
								}
								$("#store-list input").trigger("change");
								$("#article-stores").show();	
								$("#loading-stock-text").hide();	
								//alert($(".ui-li-static.ui-body-inherit.ui-li-has-count").length);
				    		}
					    	cnt++;
					    });
			});
	}
}	
function get_comments(artid) {	
	$("#comments").html("");
	$.get("http://beta.iglaset.se/articles/"+artid+"/comments.xml", function(xml) {
		$(xml).find('comment').each(function(){
			var comment = $(this).find('text').text();			
			var rating = parseInt($(this).attr('rating'));
			var nickname = $(this).attr('nickname');
			var created = $(this).attr('created');	
			$("#comments").append("<li style='font-size:13px;'><span style='float:left;'><b>"+nickname+"</b><br><font size='0.4em'>"+created.substring(0,4)+"-"+created.substring(4,6)+"-"+created.substring(6,8)+"</font></span><p class='comment-grade'><img src='http://www.iglaset.se/images/icons/grade_"+rating+"_small.gif' style='margin-top:0px;'></p><div style='clear:both;'></div><p class='comment'>"+comment+"</p></div></li>");
		});	
		$("#comments").listview("refresh");
		$("#comment-list").show();
		if(window.localStorage.getItem("token")) {
			if (window.localStorage.getItem("token").length > 1) {
				$("#write-comment").show();
			}
		}
	}).fail(function () {
		$("#comments").append("<li>Inga kommentarer än</li>").listview("refresh");
		$("#write-comment").show();

	});
	
}

function rate(art_id, rating) {
	$.get("http://beta.iglaset.se/articles/"+art_id+"/rate.xml?rating="+rating+"&user_credentials="+window.localStorage.getItem("token"), function() {

	});
	ratings_no_data = true;
	 $('#popupRate').popup("close");
	 get_article(art_id);
}

function create_comment(art_id, comment) {
	$.mobile.loading('show');
	$.post("http://beta.iglaset.se/comments.xml?user_credentials="+window.localStorage.getItem("token"), {"comment[article_id]":art_id, "comment[text]": comment}, function (data) {		

	}).always(function() {
		$.mobile.loading('hide');
		get_comments(art_id);
	});
}

function article_line(xml, htmlid) {
	$(xml).find('article').each(function(){
	 	var name = $(this).find('name').text();
	 	var image = urldecode($(this).find('small').text());
	 	var artid = $(this).attr('id');
	 	var producer = $(this).find('producer').text();
	 	var estimated_rating = $(this).find('estimated_rating').text();
	 	var avg_rating = $(this).find('avg_rating').text();
	 	var comments = $(this).find('comments').text();
	 	var ratings = $(this).find('ratings').text();
	 	var user_rating = $(this).find('user_rating').text();
	 	var est_rate = $(this).find('estimated_rating').text();
	 	var origin = $(this).find('origin').text();
	 	var origin_country = $(this).find('origin_country').text();
	 	var alc_percent = $(this).find('alc_percent').text();
	 	
	 	if (!user_rating) { user_rating="0";}
	 	if (!est_rate) { est_rate="0";}
	 		var user_rating_icon = "";
	 		var estimated_rating_icon = "";
	 		var avg_rating_icon = "";

	 		user_rating_icon = "<span class='badge badge-user-rating pull-right'>"+user_rating+"  <span class='glyphicon glyphicon-ok'></span></span>";
	 		avg_rating_icon = "<span class='badge badge-average-rating pull-right'>"+Math.floor(avg_rating)+" <span class='glyphicon glyphicon-stats'></span></span>";
	 		if (est_rate > 4) {
 				estimated_rating_icon = "<span class='badge badge-est-rating pull-right'>"+est_rate+" <span class='glyphicon glyphicon-thumbs-up'></span></span>";
 			} else {
 				estimated_rating_icon = "<span class='badge badge-est-rating pull-right'>"+est_rate+" <span class='glyphicon glyphicon-thumbs-down'></span></span>";
 			}
 			if (est_rate == 0) {
 				estimated_rating_icon = "";
 			}
 			 if (user_rating == 0) {
 				user_rating_icon = "";
 			}
 			 if (avg_rating == 0) {
 				avg_rating_icon = "";
 			}
 		/*if (parseInt(est_rate) > 0 ) {
	 		if (parseInt(user_rating) > 0 ) {
	 		}
	 		if (parseInt(avg_rating) > 0 ) {
	 		}	  					 	
 		} else {
 			if (parseInt(user_rating) > 0 ) {
	 			user_rating_icon = "<span class='badge badge-user-rating pull-right'>"+user_rating+"  <span class='glyphicon glyphicon-ok'></span></span>";
	 			//user_rating_icon = "<span class='ui-li-count count-second'>Ditt betyg "+user_rating+"</span>";
	 		}
	 		if (parseInt(avg_rating) > 0 ) {
	 			avg_rating_icon = "<span class='badge badge-average-rating pull-right'>"+Math.floor(avg_rating)+" <span class='glyphicon glyphicon-stats'></span></span>";
	 		}	 
 		}*/
	 	if (htmlid == "purchase-list" || htmlid == "basement-list") {
	 		var quantity = $(this).find('quantity').text();
	 		var est_rate = $(this).find('estimated_rating').text();
	 		var list_comment = $(this).find('list_comment').text();

		  	$("#"+htmlid).append("<li class='article-line'><a href='#article-page' onclick='viewarticle("+artid+")'><div class='thumb-wrap'><img style='margin-left:10px;' title='"+image+"' class='artimg' src='img/glasses-crop.png' onerror=\"this.src='img/glasses-crop.png';\"></div>"+name+"<br/><font style='font-size:11px;font-weight:normal;'>"+producer+"<br>Din kommentar: "+list_comment+"</font><span class='ui-li-count count-first'>"+quantity+" st</span><div class='badges'>"+avg_rating_icon+user_rating_icon+estimated_rating_icon+"</div></a></li>");
	 	} else {
		  	$("#"+htmlid).append("<li class='article-line'><a href='#article-page' onclick='viewarticle("+artid+")'><div class='thumb-wrap'><img style='margin-left:10px;' title='"+image+"' class='artimg' src='img/glasses-crop.png' onerror=\"this.src='img/glasses-crop.png';\"></div>"+name+"<br/><font style='font-size:11px;font-weight:normal;'>"+producer+"<br>"+origin+" "+origin_country+" "+alc_percent+"</font><div class='badges'>"+avg_rating_icon+user_rating_icon+estimated_rating_icon+"</div></a></li>");
	  	}
	  	$("#"+htmlid).listview("refresh");
	  	$(".artimg").each(function(d){
	  		$(this).attr('src', $(this).attr('title'));
	  	});
	});
}

function get_producer() {
	$.mobile.loading('show');

	$.get("http://beta.iglaset.se/producers/"+producer_id+".xml", function(xml) {
		producer_name = $(xml).find("name").text();
		address = $(xml).find("address").text();
		contact = $(xml).find("contact").text();
		country = $(xml).find("country").text();
		phone = $(xml).find("phone").text();
		state = $(xml).find("state").text();
		town = $(xml).find("town").text();
		url = $(xml).find("url").text();
		about = $(xml).find("about").text();
		$("#producer-name").text(producer_name);
		$("#pv-address").text(address);
		$("#pv-contact").text(contact);
		$("#pv-country").text(country);
		$("#pv-phone").text(phone);
		$("#pv-url").html("<a href='"+url+"'>"+url+"</a>");
		$("#pv-town").text(town);
		$("#pv-state").text(state);
		$("#pv-producer_id").val(producer_id);
		$("#pv-about").html(nl2br(about));

	}).always(function() {
		$.mobile.loading('hide');

	});
}
function urldecode(str) {
   return decodeURIComponent((str+'').replace(/\+/g, '%20'));
}

function ean(ean) {
//	$.mobile.loading('show');
	$("#articles").html("");
	$.get("http://beta.iglaset.se/barcodes/show_by_ean/"+ean+"?user_credentials="+window.localStorage.getItem("token"), function(xml) {
	 	article_line(xml, "articles");
	//	$.mobile.loading('hide');
		$("#search-res").show();
		$("#search-res-more-button").hide("").trigger('updatelayout');
		if ($(xml).find('article').length <1) {
			window.localStorage.setItem("latest_scanned_ean", ean);			
			alert("Hittade ej produkt med EAN:"+ean);	
		}
	}, "xml");

	$.mobile.changePage("#search-res-page");

}

function suggest_ean(artid, ean) {
	if (confirm("Är du säker på att du vill koppla EAN till artikel?")) {
		$.post("http://beta.iglaset.se/barcodes/suggest_ean.xml?user_credentials="+window.localStorage.getItem("token"), {"article_id":artid, "ean":ean}, function(xml) {
			
		}).always(function(){
			alert("Artikel kopplad till streckkod.\nTack för ditt bidrag!");
		});
		window.localStorage.removeItem("latest_scanned_ean");
	}
}

function welcome() {
	$.mobile.changePage("#welcome-page");
}

function show_res(res) {

}


function list_scan(list, incdec) {
	$.mobile.loading('show');

   $("#scan-choose-list").html("");
   $("#scan-choose-list2").html("");

	cordova.plugins.barcodeScanner.scan(
		function (result) {
			$.get("http://beta.iglaset.se/barcodes/show_by_ean/"+result.text+"?user_credentials="+window.localStorage.getItem("token"), function(xml) {
//		$.get("http://www.iglaset.se/barcodes/show_by_ean/72063002?user_credentials="+window.localStorage.getItem("token"), function(xml) {
			 	
				if ($(xml).find('article').length <1) {
					$.mobile.loading('hide');
					alert("Hittade ej produkt med EAN:"+result.text);
					window.localStorage.setItem("latest_scanned_ean", result.text);
				} else {
					$(xml).find('article').each(function(){
	 					var name = $(this).find('name').text();
					 	var image = urldecode($(this).find('small').text());
	 					var artid = $(this).attr('id');
	 					if (list==1) {
							$("#scan-choose-list").append("<li ><a href='#' onclick='update_list("+list+","+incdec+", "+artid+", true)'>"+name+"</a></li>").listview("refresh");
						} else {
							$("#scan-choose-list2").append("<li ><a href='#' onclick='update_list("+list+","+incdec+", "+artid+", true)'>"+name+"</a></li>").listview("refresh");
						}
	 				});
					if (incdec==1) {
						$("#add-remove-scan-text").html("lägga till");
						$("#add-remove-scan-text2").html("lägga till");

					} else {
						$("#add-remove-scan-text").html("ta bort");
						$("#add-remove-scan-text2").html("ta bort");
					}
					
					if (list==1) {				
						$( "#scan-choose-popup" ).popup( "open" );
					} else {
						$( "#scan-choose-popup2" ).popup( "open" );

					}	 				
	 			}
			}, "xml");
	 			//		alert(scan_articles_found);

		
			$.mobile.loading('hide');
		}, 
		function (error) {
			$.mobile.loading('hide');
	  		alert("Scanning failed: " + error);
		}
	);
}
function update_list(list, incdec, artid, close_popups) {
	$.mobile.loading('show');

	if (list==1) {
		if (incdec==1) {
			//$.get("http://iglaset.se/purchase/add/"+artid+".xml?user_credentials="+window.localStorage.getItem("token"), function(xml) {
			$.get("http://beta.iglaset.se/articles/"+artid+"/list_modify.xml?list_type=purchase&inc=1&user_credentials="+window.localStorage.getItem("token"), function(xml) {
			 if (close_popups){
			  	$('#scan-choose-popup').popup("close");
			 }
			  	purchase_no_data = true;
				purchase_list(1);
			}).always(function() {
				$.mobile.loading('hide');
			});
		} else {
			$.get("http://beta.iglaset.se/articles/"+artid+"/list_modify.xml?list_type=purchase&dec=1&user_credentials="+window.localStorage.getItem("token"), function(xml) {
			 if (close_popups){
			  	$('#scan-choose-popup').popup("close");
			 }			 
			 	purchase_no_data = true;			  
				purchase_list(1);
			}).always(function() {
				$.mobile.loading('hide');
			});;
		}
	}
	else {
		if (incdec==1) {
			$.get("http://beta.iglaset.se/articles/"+artid+"/list_modify.xml?list_type=basement&inc=1&user_credentials="+window.localStorage.getItem("token"), function(xml) {
			 if (close_popups){
			  	$('#scan-choose-popup2').popup("close");
			 }
			  	basement_no_data = true;
				basement_list(1);
			}).always(function() {
				$.mobile.loading('hide');
			});;
		} else {
			$.get("http://beta.iglaset.se/articles/"+artid+"/list_modify.xml?list_type=basement&dec=1&user_credentials="+window.localStorage.getItem("token"), function(xml) {
			 if (close_popups){
			  	$('#scan-choose-popup2').popup("close");
			 }
			  	basement_no_data = true;			  
				basement_list(1);
			}).always(function() {
				$.mobile.loading('hide');
			});;
		}
	}
}
function scan() {
	//var scanner = cordova.require("com.phonegap.plugins.barcodescanner");
	   
	cordova.plugins.barcodeScanner.scan(
		function (result) {
			ean(result.text);

		}, 
		function (error) {
	  		alert("Scanning failed: " + error);
		}
	);
}
function f(str, page) {
	alert(str);
	$.mobile.changePage("#search-res-page");
		//view_articles(qs("find"), 1);
}
function viewarticle(artid) {
	$("#article-view").hide();
	$("#comment-list").hide();
	$("#store-list").hide();

	//$.mobile.changePage('index.html?artid='+artid, { dataUrl : "?artid="+artid+"#article-page", data : { 'artid' : artid }, reloadPage : true, changeHash : true });
	article_id = artid;
}
function qs(key) {
    key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
    var match = location.search.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"));
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}
function nl2br (str, is_xhtml) {
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}
function force_calculate_recommendations() {
	if (window.localStorage.getItem("user_id")>0) {
		$("#calculating-text").show();
		$("#calculating").show();
		$("#recommendations-reload-button").hide();
		$.get("http://vabba.nu/iglaset/vogoo/test.php?action=calcylate&u="+window.localStorage.getItem("user_id"), function(data) {
		}).done(function () {
			$("#calculating-text").hide();
			$("#calculating").hide();	
			recommended_no_data=true;
			get_recommended_articles(1);
		});
	}
}
function update_recommendations() {
	if (window.localStorage.getItem("user_id")>0) {
		$("#calculating-text").show();
		$("#calculating").show();
		$("#recommendations-reload-button").hide();
		$.get("http://vabba.nu/iglaset/vogoo/test.php?action=login&u="+window.localStorage.getItem("user_id"), function(data) {
		}).done(function () {
			recommended_no_data=true;			
			$("#calculating-text").hide();
			$("#calculating").hide();	
		});
	}
}
