import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import ICommunityUsecase from "../interfaces/usecase/ICommunity.usecase.interface";
import StatusCodes from "../constants/auth/statusCodes";
import IAuthRequest from "../interfaces/common/IAuthRequest.interface";
import { log } from "console";


class CommunityController {
  private communityUsecase: ICommunityUsecase;

  constructor(communityUsecase: ICommunityUsecase) {
    this.communityUsecase = communityUsecase;
  }

  // POST /communities
  public async createCommunity(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {

      const userId = req.userId!;

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }

      const { name, description, type, tags, imageUrl, coverImageUrl } = req.body.data;
      console.log(req.body.data);
      
      const community = await this.communityUsecase.createCommunity({
        name,
        description,
        type,
        imageUrl, 
        coverImageUrl,
        ownerId: userId.toString(),
        tags,
      });
      res.status(StatusCodes.Created).json({community});
    } catch (error) {
      next(error);
    }
  }

  // GET /communities/:id
  public async getCommunityById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Validate that id is a valid 24-character hex string
      if (!id || typeof id !== 'string' || id.length !== 24 || !/^[0-9A-Fa-f]+$/.test(id)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid Community ID" });
        return;
      }

      const communityId = new Types.ObjectId(id);

      const community = await this.communityUsecase.getCommunityById(communityId);
      res.status(StatusCodes.Success).json({community});
    } catch (error) {
      next(error);
    }
  }

  // GET /communities/search?searchTerm=...
  public async searchCommunities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { searchTerm } = req.query;
      if (typeof searchTerm !== "string") {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid search term" });
        return;
      }
      const communities = await this.communityUsecase.searchCommunitiesByName(searchTerm);
      res.status(StatusCodes.Success).json({communities});
    } catch (error) {
      next(error);
    }
  }

  // PUT /communities/:id
  public async updateCommunity(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {

      const { data } = req.body
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }
      if (!communityId) {
        res.status(StatusCodes.BadRequest).json({ error: "Community ID is required" })
        return;
      }

      const updatedCommunity = await this.communityUsecase.updateCommunity(
        userId,
        communityId,
        data
      );

      res.status(StatusCodes.Success).json({updatedCommunity});

    } catch (error) {
      next(error);
    }
  }

  // DELETE /communities/:id
  public async deleteCommunity(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }
      if (!communityId) {
        res.status(StatusCodes.BadRequest).json({ error: "Community ID is required" })
        return;
      }

      const result = await this.communityUsecase.deleteCommunity(userId, communityId);
      res.status(StatusCodes.Success).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  // GET /communities
  public async listCommunities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const communities = await this.communityUsecase.listCommunities();
      res.status(StatusCodes.Success).json({communities});
    } catch (error) {
      next(error);
    }
  }

  // GET /users/:userId/communities OR use req.user
  public async getCommunitiesByUser(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {

      const userId = req.userId!;

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }

      const communities = await this.communityUsecase.getCommunitiesByUser(userId);
      res.status(StatusCodes.Success).json({communities});
    } catch (error) {
      next(error);
    }
  }

  // POST /communities/:communityId/request
  public async requestToJoinCommunity(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }
      if (!communityId) {
        res.status(StatusCodes.BadRequest).json({ error: "Community ID is required" })
        return;
      }


      const result = await this.communityUsecase.requestToJoinCommunity(
        communityId,
        userId
      );

      res.status(StatusCodes.Success).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /communities/join/approve
  public async approveJoinRequest(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {

      const memberId = new Types.ObjectId(String(req.body.memberId));
      const roleId = new Types.ObjectId(String(req.body.roleId));
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }
      if (!communityId) {
        res.status(StatusCodes.BadRequest).json({ error: "Community ID is required" })
        return;
      }

      if (!memberId) {
        res.status(StatusCodes.BadRequest).json({ error: "Member ID is required" })
        return;
      }
      if (!roleId) {
        res.status(StatusCodes.BadRequest).json({ error: "Role ID is required" })
        return;
      }

      const result = await this.communityUsecase.approveJoinRequest(
        communityId, userId, memberId, roleId
      );
      res.status(StatusCodes.Success).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /communities/join/reject
  public async rejectJoinRequest(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = new Types.ObjectId(String(req.body.memberId));
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }
      if (!communityId) {
        res.status(StatusCodes.BadRequest).json({ error: "Community ID is required" })
        return;
      }

      const result = await this.communityUsecase.rejectJoinRequest(
        communityId, userId, memberId
      );
      res.status(StatusCodes.Success).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /communities/:communityId/leave
  public async leaveCommunity(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }
      if (!communityId) {
        res.status(StatusCodes.BadRequest).json({ error: "Community ID is required" })
        return;
      }

      const result = await this.communityUsecase.leaveCommunity(
        communityId, userId
      );
      res.status(StatusCodes.Success).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /communities/member/add
  public async addMember(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = new Types.ObjectId(String(req.body.memberId));
      const roleId = new Types.ObjectId(String(req.body.roleId));
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }
      if (!communityId) {
        res.status(StatusCodes.BadRequest).json({ error: "Community ID is required" })
        return;
      }

      const result = await this.communityUsecase.addMember(
        userId, communityId, memberId, roleId
      );
      res.status(StatusCodes.Success).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /communities/member/remove
  public async removeMember(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = new Types.ObjectId(String(req.body.memberId));
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }
      if (!communityId) {
        res.status(StatusCodes.BadRequest).json({ error: "Community ID is required" })
        return;
      }

      const result = await this.communityUsecase.removeMember(
        communityId, userId, memberId
      );
      res.status(StatusCodes.Success).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /communities/:communityId/tag/:tagId
  public async addTag(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      if (!communityId) {
        res.status(StatusCodes.BadRequest).json({ error: "Community ID is required" })
        return;
      }

      const tagId = new Types.ObjectId(req.params.tagId);

      const result = await this.communityUsecase.addTag(
        userId,
        communityId,
        tagId
      );
      res.status(StatusCodes.Success).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /communities/:communityId/tag/:tagId
  public async removeTag(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {

      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      if (!communityId) {
        res.status(StatusCodes.BadRequest).json({ error: "Community ID is required" })
        return;
      }

      const tagId = new Types.ObjectId(req.params.tagId);

      const result = await this.communityUsecase.removeTag(
        userId,
        communityId,
        tagId
      );
      res.status(StatusCodes.Success).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  // GET /communities/tag/:tagId
  public async filterCommunitiesByTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tagId = new Types.ObjectId(req.params.tagId);
      const communities = await this.communityUsecase.filterCommunitiesByTag(tagId);
      res.status(StatusCodes.Success).json({communities});
    } catch (error) {
      next(error);
    }
  }

  // GET /communities/category/:categoryId
  public async filterCommunitiesByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = new Types.ObjectId(req.params.categoryId);
      const communities = await this.communityUsecase.filterCommunitiesByCategory(categoryId);
      res.status(StatusCodes.Success).json({communities});
    } catch (error) {
      next(error);
    }
  }

  // GET /all categories
  public async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await this.communityUsecase.getCategories();
      res.status(StatusCodes.Success).json({categories});
    } catch (error) {
      next(error);
    }
  }

  // GET /All Tags
  public async getAllTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      const tags = await this.communityUsecase.getAllTags();

      if (!tags || tags.length === 0) {
        res.status(StatusCodes.NotFound).json({ message: "No tags found" });
        return;
      }

      res.status(StatusCodes.Success).json({tags});
    } catch (error) {
      next(error);
    }
  }

  // GET /tag by Id
  public async getTagById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      const {id} = req.params

      const tag = await this.communityUsecase.getTagById(new Types.ObjectId(id));

      if (!tag) {
        res.status(StatusCodes.NotFound).json({ message: "No tag found" });
        return;
      }

      res.status(StatusCodes.Success).json({tag});
    } catch (error) {
      next(error);
    }
  }

}



export default CommunityController;
