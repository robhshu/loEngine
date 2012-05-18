/*
	Light Object Engine Display (loEngineDisp)
	
	Written by robhshu, May 2012
	v0.0	Split rendering into seperate module
*/

/*
	loDraw
		Draw light object on rendering context
*/
loDraw = function( ctx, loObj, style )
{
	ctx.fillStyle = style;
	ctx.beginPath();
	
	if( !loObj.points )
	{
		// TODO: circles do not use .pos yet
		ctx.arc(
			loObj.pos.x,
			loObj.pos.y,
			loObj.radius,
			0,
			2*Math.PI,
			false
		)
	}
	else
	{
		var p = loObj.at( 0 )
		ctx.moveTo( p.x, p.y );
    
		loEachVert(
			loObj,
			1,
			function( loP )
			{
				ctx.lineTo( loP.x, loP.y );
			}
		);
		
		ctx.lineTo( p.x, p.y );
		ctx.closePath();
	}
	
	ctx.fill();
}


loDrawDebug = function( ctx, loObj )
{
	if( !loObj.points )
	{
		// draw container circle
		ctx.strokeStyle = "rgb(200,200,200)";
		loDraw( ctx, loObj, "rgb(180,180,180)" )
		ctx.stroke()
		
		// draw midpoints
		ctx.strokeStyle = "rgb(100,100,100)";
		ctx.beginPath();
		
		// TODO: circles do not use .pos yet
		ctx.arc(
			loObj.pos.x,
			loObj.pos.y,
			1,
			0,
			2*Math.PI,
			false
		)
		ctx.stroke()
	}
	else
	{
		// draw object
		loDraw( ctx, loObj, "rgb(180,180,180)" )
		
		// draw lines to midpoints
		var i = 0;
		while( i < loObj.sides )
		{
			// pass1
			ctx.strokeStyle = "rgb(200,200,200)";
			ctx.beginPath();
			var c = loObj.pos;
			ctx.moveTo( c.x, c.y )
			var a = loObj.midApprox( i )
			ctx.lineTo( a.x, a.y )
			ctx.stroke();
		
			// pass2
			ctx.strokeStyle = "rgb(100,100,100)";
			ctx.beginPath();
			var c = loObj.pos;
			ctx.moveTo( c.x, c.y )
			var a = loObj.midat2( i )
			ctx.lineTo( a.x, a.y )
			ctx.stroke();
			
			++i
		}
		
		// draw container circle
		ctx.strokeStyle = "rgb(200,200,200)";
		ctx.beginPath();
		ctx.arc(
			loObj.pos.x,
			loObj.pos.y,
			loObj.radius,
			0,
			2*Math.PI,
			false
		)
		ctx.stroke()
		
		// draw container circle
		ctx.strokeStyle = "rgba(0,0,0,0.4)";
		ctx.beginPath();
		ctx.arc(
			loObj.pos.x,
			loObj.pos.y,
			loObj.apothem(),
			0,
			2*Math.PI,
			false
		)
		ctx.stroke()
		
		ctx.fillStyle = "rgba(0,0,0,0.4)";
		loEachVert(
			loObj,
			0,
			function( loP )
			{
				ctx.beginPath()
				ctx.fillRect( loP.x-3, loP.y-3, 6, 6 );
				ctx.fill()
			}
		);
	}
}


loDrawLight = function( ctx, loObjFrom )
{
	var grd = ctx.createRadialGradient(
		loObjFrom.x,
		loObjFrom.y,
		1,
		loObjFrom.x,
		loObjFrom.y,
		300 // STATIC RADIUS FOR NOW
	);
	
	grd.addColorStop(0, "rgb(255,255,255)");
	// dark blue
	grd.addColorStop(1, "#000000");
	
	ctx.beginPath();
	ctx.arc(
		loObjFrom.x,
		loObjFrom.y,
		300, // STATIC RADIUS FOR NOW
		0,
		2*Math.PI,
		false
	)
	
	ctx.fillStyle = grd;
	ctx.fill();
}


loDrawShadowCirc = function( ctx, loObj, loObjFrom )
{
  var res = loObj.shadowing( loObjFrom )
  
  if( res.length === 2 )
  {
    var p1 = res[0]
    p1.addi( loObj.pos )
    var p1e = loMakeVec2( loObjFrom, p1 ).asPoint().project( p1, 300 )

    var p2 = res[1]
    p2.addi( loObj.pos )
    var p2e = loMakeVec2( loObjFrom, p2 ).asPoint().project( p2, 300 )

    ctx.fillStyle = "rgba(0,0,0,1)"
    ctx.strokeStyle = "rgba(0,0,0,0)"

    ctx.beginPath()
    ctx.moveTo( p1e.x, p1e.y );
    ctx.lineTo( p1.x, p1.y );
    ctx.lineTo( p2.x, p2.y );
    ctx.lineTo( p2e.x, p2e.y );
    ctx.moveTo( p1e.x, p1e.y );

    ctx.fill();
    ctx.stroke()
  }
}

loDrawShadow = function( ctx, loObj, loObjFrom )
{
	var plyCenter = loObj.pos;
	var ps = []

  var j = 0;
  while( j < loObj.sides )
  {
    // Find the midpoint on the edge
    var mp = loObj.midat( j )

    // Make vector from shape center to midpoint
    var v1 = loMakeVec2( plyCenter, mp )

    // Make vector from light source to midpoint
    var v2 = loMakeVec2( loObjFrom, mp )

    // If the angle between these two vectors is less than 90deg
    if( v1.angle( v2 ) < 90 )
      // Add to a list of points which cast a shadow
      ps.push( j )

    ++j
  }
  
  j = 0;
  while( j < ps.length )
  {
    var p1 = loObj.at( ps[ j ] )
    var p1e = loMakeVec2( loObjFrom, p1 ).asPoint().project( p1, 300 )

    var p2 = loObj.at( ps[ j ]+1 )
    var p2e = loMakeVec2( loObjFrom, p2 ).asPoint().project( p2, 300 )

    ctx.fillStyle = "rgba(0,0,0,1)"
    ctx.strokeStyle = "rgba(0,0,0,0)"

    ctx.beginPath()
    ctx.moveTo( p1e.x, p1e.y );
    ctx.lineTo( p1.x, p1.y );
    ctx.lineTo( p2.x, p2.y );
    ctx.lineTo( p2e.x, p2e.y );
    ctx.moveTo( p1e.x, p1e.y );

    ctx.fill();
    ctx.stroke()

    ++j
  }

}



