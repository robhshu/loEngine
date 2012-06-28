/*
	Light Object Engine Display (loEngineDisp)
	
	Written by robhshu, May 2012
	v0.0	Split rendering into seperate module
*/

Array.prototype.forEach = function( func )
{
  var i=0;
  while( i < this.length ) func( this[i++] )
}

loPoint.prototype.lineFrom = function( ctx )
{
  ctx.lineTo( this.x, this.y )
}

loPoint.prototype.moveFrom = function( ctx )
{
  ctx.moveTo( this.x, this.y )
}

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


loDrawLight = function( ctx, loObjFrom, secondPass )
{
  // todo: type checking
  
  if( !( loObjFrom.pos ) )
    alert( 'Warning: .pos attribute not passed' )
  
	var grd = ctx.createRadialGradient(
		loObjFrom.pos.x,
		loObjFrom.pos.y,
		25, // NEW
		loObjFrom.pos.x,
		loObjFrom.pos.y,
		loObjFrom.powradius
	);
	
  grd.addColorStop(0.1, "#fff");
  grd.addColorStop(0.2, "rgba(255,255,255,0.9)");
  grd.addColorStop(1, loObjFrom.colour);
	
	ctx.beginPath();
	ctx.arc(
		loObjFrom.pos.x,
		loObjFrom.pos.y,
		loObjFrom.powradius,
		0,
		2*Math.PI,
		false
	)
  
  ctx.globalCompositeOperation = ( secondPass === true ) ? "darker" : "lighter";
	ctx.fillStyle = grd;
	ctx.fill();
  ctx.globalCompositeOperation = "source-over"; // back to default
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

    ctx.fillStyle = "#000"
    ctx.strokeStyle = "#000"

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

function loDrawShadow( ctx, loObj, loObjFrom, type )
{
  var j = 0
	while( j < loObj.sides )
  {
    // Find the midpoint on the edge
    var mp = loObj.midat( j )

    // Make vector from shape center to midpoint
    var v1 = loMakeVec2( loObj.pos, mp ).asPoint()

    // Make vector from light source to midpoint
    var v2 = loMakeVec2( loObjFrom, mp ).asPoint()

    var cross = v1.x*v2.x + v1.y*v2.y

    /*
      types
        occluded  o
        solid     s
    */
    
    if( ( type === 's' ? cross <= 0 : cross > 0 ) )
    {
      var p1 = loObj.at( j )
      var p2 = loObj.at( j+1 )
      
      var p1e = loMakeVec2( loObjFrom, p1 ).asPoint().project( p1, 300 + loObj.radius )
      var p2e = loMakeVec2( loObjFrom, p2 ).asPoint().project( p2, 300 + loObj.radius )

      ctx.fillStyle = "#000"
      ctx.strokeStyle = "#000"
      
      // fill each projected shadow region
      ctx.beginPath()
      {
        ctx.moveTo( p1.x, p1.y );
        ctx.lineTo( p1e.x, p1e.y );
        ctx.lineTo( p2e.x, p2e.y );
        ctx.lineTo( p2.x, p2.y );
      }
      ctx.fill();

      // stroke the line projections
      //if( type === 'o' )
      {
        ctx.beginPath()
        {
          ctx.moveTo( p1.x, p1.y );
          ctx.lineTo( p1e.x, p1e.y );
          ctx.moveTo( p2.x, p2.y );
          ctx.lineTo( p2e.x, p2e.y );
        }
        ctx.stroke();
      }
    }
    
    ++j
  }
}

/*
  Render soft-edged shadows from a circular light souce
*/

loDrawShadowEx = function( ctx, loObj, loObjFrom )
{
	var plyCenter = loObj.pos;
	var ps = []

  // same code as before to find the normals..
  
  var j = 0;
  while( j < loObj.sides )
  {
  
  /*
    // get the points
    var p1 = loObj.at( j ) // j is know to be in bounds
    var p2 = loObj.at( (j+1) % loObj.sides )
    
    // Find the midpoint on the edge
    var mp = p1.copy();
    mp.subi( p2 )
    mp.x /= 2
    mp.y /= 2
    mp.addi( p2 )
    mp.addi( loObj.pos )
    */
    // NOTE: bceause p1 and p2 may be used later, the midpoint can be
    // calculated here without another function call
    var mp = loObj.midat( j )

    // Make vector from shape center to midpoint
    var v1 = loMakeVec2( plyCenter, mp )

    // Make vector from light source to midpoint
    var v2 = loMakeVec2( loObjFrom.pos, mp )

    // If the angle between these two vectors is less than 90deg
    if( v1.angle( v2 ) <= 90 )
    {
      ps.push( j )
    }
    
    ++j
  }

  j = 0;
  
  while( j < ps.length )
  {
    // get the points
    var p1 = loObj.at( ps[j] ) // j is know to be in bounds
    var p2 = loObj.at( (ps[j]+1) % loObj.sides )
    
    // for point 1
    var fromLight1 = loObjFrom.shadowing( p1 )
    
    if( fromLight1.length > 0 )
    {
      var p1_1 = fromLight1[0].add( loObjFrom.pos )
      var p1_2 = fromLight1[1].add( loObjFrom.pos )
    
      p1_1 = loMakeVec2( p1_1, p1 ).asPoint().project( p1, 300 )
      p1_2 = loMakeVec2( p1_2, p1 ).asPoint().project( p1, 300 )

      // for point 2
      var fromLight2 = loObjFrom.shadowing( p2 )
      
      if( fromLight2.length > 0 )
      {
        var p2_1 = fromLight2[0].add( loObjFrom.pos )
        var p2_2 = fromLight2[1].add( loObjFrom.pos )
      
        p2_1 = loMakeVec2( p2_1, p2 ).asPoint().project( p2, 300 )
        p2_2 = loMakeVec2( p2_2, p2 ).asPoint().project( p2, 300 )
        
        // draw the prenumbra
        ctx.fillStyle = "rgba(200,20,20,0.2)"
        
        ctx.beginPath()
        
        p1.moveFrom( ctx )
        p1_1.lineFrom( ctx )
        p1_2.lineFrom( ctx )
        p1.lineFrom( ctx )
        
        ctx.fill();
        
        
        //// project points
        //var p1e = loMakeVec2( loObjFrom.pos, p1 ).asPoint().project( p1, 300 )
        //var p2e = loMakeVec2( loObjFrom.pos, p2 ).asPoint().project( p2, 300 )
        
        // todo: get the _1 or _2 angle from the line
        // then we can project the points if we want to join the shape
        // OR, it its on the edge, do something  like this:
        
        // now draw the umbra
        ctx.fillStyle = "rgb(200,20,20)"
        
        ctx.beginPath()
        
        p1.moveFrom( ctx )
        p1_1.lineFrom( ctx )
        p2_2.lineFrom( ctx )
        p2.lineFrom( ctx )
        // join it back?

        ctx.fill();
        
      }
    }
    
    ++j
  }
}
