import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import ICommunityUsecase from "../interfaces/usecase/ICommunity.usecase.interface";
import ICommunityController from "../interfaces/controllers/ICommunityController.interface";
import StatusCodes from "../constants/auth/statusCodes";
import IAuthRequest from "../interfaces/common/IAuthRequest.interface";


/**
 * Parse a route/body param into an ObjectId. On a missing or malformed
 * value it sends a 400 and returns null, so the caller can `return` early.
 * (`new Types.ObjectId(undefined)` mints a random id and throws on other
 * bad input, so the old `if (!id)` guards never actually fired.)
 */
function parseObjectId(res: Response, raw: unknown, label: string): Types.ObjectId | null {
  if (typeof raw !== "string" || !Types.ObjectId.isValid(raw)) {
    res.status(StatusCodes.BadRequest).json({ error: `${label} is required` });
    return null;
  }
  return new Types.ObjectId(raw);
}


class CommunityController implements ICommunityController {
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
      const communityId = parseObjectId(res, req.params.id, "Community ID");
      if (!communityId) return;

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

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }

      const communityId = parseObjectId(res, req.params.communityId, "Community ID");
      if (!communityId) return;

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

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }

      const communityId = parseObjectId(res, req.params.communityId, "Community ID");
      if (!communityId) return;

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

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }

      const communityId = parseObjectId(res, req.params.communityId, "Community ID");
      if (!communityId) return;

      const result = await this.communityUsecase.requestToJoinCommunity(
        userId,
        communityId
      );

      res.status(StatusCodes.Success).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /communities/join/approve
  public async approveJoinRequest(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {

      const userId = req.userId!;

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }

      const communityId = parseObjectId(res, req.params.communityId, "Community ID");
      if (!communityId) return;

      const memberId = parseObjectId(res, req.body.memberId, "Member ID");
      if (!memberId) return;

      const roleId = parseObjectId(res, req.body.roleId, "Role ID");
      if (!roleId) return;

      const result = await this.communityUsecase.approveJoinRequest(
        userId, communityId, memberId, roleId
      );
      res.status(StatusCodes.Success).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /communities/join/reject
  public async rejectJoinRequest(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }

      const communityId = parseObjectId(res, req.params.communityId, "Community ID");
      if (!communityId) return;

      const memberId = parseObjectId(res, req.body.memberId, "Member ID");
      if (!memberId) return;

      const result = await this.communityUsecase.rejectJoinRequest(
        userId, communityId, memberId
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

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }

      const communityId = parseObjectId(res, req.params.communityId, "Community ID");
      if (!communityId) return;

      const result = await this.communityUsecase.leaveCommunity(
        userId, communityId
      );
      res.status(StatusCodes.Success).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /communities/member/add
  public async addMember(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }

      const communityId = parseObjectId(res, req.params.communityId, "Community ID");
      if (!communityId) return;

      const memberId = parseObjectId(res, req.body.memberId, "Member ID");
      if (!memberId) return;

      const roleId = parseObjectId(res, req.body.roleId, "Role ID");
      if (!roleId) return;

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
      const userId = req.userId!;

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }

      const communityId = parseObjectId(res, req.params.communityId, "Community ID");
      if (!communityId) return;

      const memberId = parseObjectId(res, req.body.memberId, "Member ID");
      if (!memberId) return;

      const result = await this.communityUsecase.removeMember(
        userId, communityId, memberId
      );
      res.status(StatusCodes.Success).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /community/kick/:communityId
  public async kickMember(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" })
        return;
      }

      const communityId = parseObjectId(res, req.params.communityId, "Community ID");
      if (!communityId) return;

      const memberId = parseObjectId(res, req.body.memberId, "Member ID");
      if (!memberId) return;

      const result = await this.communityUsecase.kickMember(userId, communityId, memberId);
      res.status(StatusCodes.Success).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /communities/:communityId/tag/:tagId
  public async addTag(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;

      const communityId = parseObjectId(res, req.params.communityId, "Community ID");
      if (!communityId) return;

      const tagId = parseObjectId(res, req.params.tagId, "Tag ID");
      if (!tagId) return;

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

      const communityId = parseObjectId(res, req.params.communityId, "Community ID");
      if (!communityId) return;

      const tagId = parseObjectId(res, req.params.tagId, "Tag ID");
      if (!tagId) return;

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
      const tagId = parseObjectId(res, req.params.tagId, "Tag ID");
      if (!tagId) return;

      const communities = await this.communityUsecase.filterCommunitiesByTag(tagId);
      res.status(StatusCodes.Success).json({communities});
    } catch (error) {
      next(error);
    }
  }

  // GET /communities/category/:categoryId
  public async filterCommunitiesByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = parseObjectId(res, req.params.categoryId, "Category ID");
      if (!categoryId) return;

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

      const tagId = parseObjectId(res, req.params.id, "Tag ID");
      if (!tagId) return;

      const tag = await this.communityUsecase.getTagById(tagId);

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
